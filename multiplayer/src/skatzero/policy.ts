import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { InferenceSession, Tensor } from 'onnxruntime-node'
import { type Card, type Contract, pointsOf, trickWinnerIndex } from '../../../app/src/lib/skat/cards'
import type { Game, Seat } from '../../../app/src/lib/skat/game'
import { type ZCard, type ZPlay, type ZState, type ZTrump, encode, swapColors } from './encode'

// SkatZero's card play (SKATGO-38): nine resident ONNX sessions — one per game type (D for every
// suit game, G for Grand, N for Null) and relative seat — and the decision procedure the selection
// was measured with (SKATGO-22: skat-ai/tools/skatzero-bot.py, Driver.evaluate/choose): every legal
// card valued by the net, and when the seat's card completes a non-Null trick that it wins, that card
// valued instead by the best lead it leaves. The rules engine stays the judge of who wins a trick.
//
// A seat decides from a PlayerView (viewOf): only what a person in it sees — its own cards, the cards
// played, the skat once it is the declarer who picked it up, a Null Ouvert declarer's open cards. Any
// failure throws; nothing here falls back to another player.

export const SKATZERO_COMMIT = '1fe5cabbd5f9c3e77ab51714b0ac702e5a71e53b'

type Manifest = { commit: string; files: { name: string; bytes: number; sha256: string }[] }
const MODELS = ['D_0', 'D_1', 'D_2', 'G_0', 'G_1', 'G_2', 'N_0', 'N_1', 'N_2']
const OBS_WIDTH: Record<string, number> = { D_0: 555, G_0: 555, D_1: 573, D_2: 573, G_1: 573, G_2: 573, N_0: 314, N_1: 364, N_2: 364 }

/** The model files a directory holds, checked against its manifest: size and SHA-256 of each of nine. */
export async function verifyModels(dir: URL): Promise<Map<string, Uint8Array>> {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', dir), 'utf8')) as Manifest
  if (manifest.commit !== SKATZERO_COMMIT) throw new Error('skatzero_manifest_commit')
  const out = new Map<string, Uint8Array>()
  for (const name of MODELS) {
    const entry = manifest.files.find((f) => f.name === `${name}.onnx`)
    if (!entry) throw new Error(`skatzero_model_missing ${name}`)
    const bytes = new Uint8Array(await readFile(new URL(`models/${name}.onnx`, dir)))
    const sha = createHash('sha256').update(bytes).digest('hex')
    if (bytes.length !== entry.bytes || sha !== entry.sha256) throw new Error(`skatzero_model_altered ${name}`)
    out.set(name, bytes)
  }
  return out
}

/** Everything one seat about to play a card may know, in product cards; seats relative to the
 *  declarer (0 the declarer, 1 and 2 the defenders in play order). */
export type PlayerView = {
  contract: Contract
  me: number
  /** The seat's cards in the order it holds them. */
  hand: Card[]
  /** Every card played so far, in order, the trick in progress included. */
  trace: [number, Card][]
  /** The skat this seat put away, if it is the declarer who picked it up. */
  skat: Card[]
  /** Card points banked: [declarer, defenders] — the declarer's own skat included when it knows it. */
  points: [number, number]
  handGame: boolean
  /** A Null Ouvert declarer's cards as they lie on the table. */
  openCards: Card[] | null
}

export type Policy = {
  /** The card this seat plays now. */
  choose: (v: PlayerView) => Promise<Card>
  /** The net's value for each legal card (before any lookahead), in hand order. */
  values: (v: PlayerView) => Promise<{ card: Card; value: number }[]>
  release: () => Promise<void>
}

/** Load, verify and warm the nine sessions. Rejects if any model is missing, altered or misshapen. */
export async function loadPolicy(dir: URL): Promise<Policy> {
  // The runtime's own telemetry stays off; it is read when the library loads (also set in the image).
  process.env.ORT_DISABLE_TELEMETRY ??= '1'
  const ort = await import('onnxruntime-node')
  const bytes = await verifyModels(dir)
  const sessions = new Map<string, InferenceSession>()
  for (const name of MODELS) {
    const s = await ort.InferenceSession.create(bytes.get(name)!, { executionProviders: ['cpu'], intraOpNumThreads: 1, interOpNumThreads: 1 })
    const names = [...s.inputNames].sort().join()
    if (names !== 'actions,history,obs' || s.outputNames.join() !== 'output') throw new Error(`skatzero_model_shape ${name}`)
    sessions.set(name, s)
  }

  async function run(name: string, obs: Float32Array, history: Float32Array, actions: Float32Array, n: number): Promise<Float32Array> {
    const width = OBS_WIDTH[name]
    if (obs.length !== width || history.length !== 1050 || actions.length !== n * 32 || n < 1) throw new Error('skatzero_input_shape')
    const obsB = new Float32Array(n * width)
    const histB = new Float32Array(n * 1050)
    for (let i = 0; i < n; i++) {
      obsB.set(obs, i * width)
      histB.set(history, i * 1050)
    }
    const out = await sessions.get(name)!.run({
      obs: new ort.Tensor('float32', obsB, [n, width]),
      history: new ort.Tensor('float32', histB, [n, 10, 105]),
      actions: new ort.Tensor('float32', actions, [n, 32]),
    })
    const t = out.output as Tensor
    const data = t.data as Float32Array
    if (t.dims.length !== 1 || t.dims[0] !== n || data.length !== n || !data.every(Number.isFinite)) throw new Error('skatzero_output')
    return data
  }

  async function evaluate(gametype: 'D' | 'G' | 'N', s: ZState): Promise<Map<ZCard, number>> {
    const e = encode(s)
    const values = await run(`${gametype}_${s.self}`, e.obs, e.history, e.actions, e.candidates.length)
    return new Map(e.candidates.map((c, i) => [c, values[i]]))
  }

  /** The measured driver's choice: first maximum, after the one-step lookahead. */
  async function chooseZ(gametype: 'D' | 'G' | 'N', s: ZState, contract: Contract, swap: (c: ZCard) => Card): Promise<ZCard> {
    let values = await evaluate(gametype, s)
    const inTrick = s.trace.length % 3
    if (gametype !== 'N' && inTrick === 2 && s.hand.length > 1) {
      const looked = new Map<ZCard, number>()
      for (const [card, value] of values) {
        const full: ZPlay[] = [...s.trace.slice(-2), [s.self, card]]
        const winner = full[trickWinnerIndex(full.map(([, c]) => swap(c)), contract)][0]
        if (winner !== s.self) {
          looked.set(card, value)
          continue
        }
        const points: [number, number] = [...s.points]
        points[s.self === 0 ? 0 : 1] += pointsOf(full.map(([, c]) => swap(c)))
        const after = await evaluate(gametype, { ...s, hand: s.hand.filter((c) => c !== card), trace: [...s.trace, [s.self, card]], points })
        looked.set(card, Math.max(...after.values()))
      }
      values = looked
    }
    let best: ZCard | null = null
    let top = -Infinity
    for (const [card, value] of values) if (value > top) [best, top] = [card, value]
    if (best === null) throw new Error('skatzero_no_choice')
    return best
  }

  async function values(v: PlayerView) {
    const { gametype, state, toProduct } = toZ(v)
    return [...(await evaluate(gametype, state))].map(([c, value]) => ({ card: toProduct(c), value }))
  }

  async function choose(v: PlayerView): Promise<Card> {
    const { gametype, state, toProduct } = toZ(v)
    return toProduct(await chooseZ(gametype, state, v.contract, toProduct))
  }

  // Warm every session once before the service says it is ready.
  for (const name of MODELS) {
    const n = 2
    await run(name, new Float32Array(OBS_WIDTH[name]), new Float32Array(1050), new Float32Array(n * 32), n)
  }

  return { choose, values, release: async () => { for (const s of sessions.values()) await s.release() } }
}

/**
 * What `seat` sees of a game in play: its own hand, the played tricks and the trick in progress, the
 * declaration, the skat only when the seat is the declarer who picked it up, and a Null Ouvert
 * declarer's hand, which lies open. Never the other hands.
 */
export function viewOf(g: Game, seat: Seat): PlayerView {
  if (g.phase !== 'play' || g.declarer === null || !g.declaration || g.turn !== seat) throw new Error('skatzero_not_to_play')
  const declarer = g.declarer
  const rel = (s: Seat) => (s - declarer + 3) % 3
  const knowsSkat = seat === declarer && g.pickedUp
  const points: [number, number] = [knowsSkat ? pointsOf(g.skat) : 0, 0]
  for (const t of g.tricks) points[t.winner === declarer ? 0 : 1] += pointsOf(t.cards.map((p) => p.card))
  const open = g.declaration.contract.kind === 'null' && g.declaration.ouvert
  return {
    contract: g.declaration.contract,
    me: rel(seat),
    hand: g.hands[seat],
    trace: [...g.tricks.flatMap((t) => t.cards), ...g.trick].map((p) => [rel(p.seat), p.card]),
    skat: knowsSkat ? g.skat : [],
    points,
    handGame: !g.pickedUp,
    openCards: open ? g.hands[declarer] : null,
  }
}

const RANK_Z: Record<string, string> = { '10': 'T' }
const RANK_P: Record<string, string> = { T: '10' }

/** A view in SkatZero's space: raw card names, and every suit game played as diamonds. */
export function toZ(v: PlayerView): { gametype: 'D' | 'G' | 'N'; state: ZState; toProduct: (c: ZCard) => Card } {
  const c = v.contract
  const gametype = c.kind === 'grand' ? 'G' : c.kind === 'null' ? 'N' : 'D'
  const trump: ZTrump = c.kind === 'grand' ? 'J' : c.kind === 'null' ? null : 'D'
  const swapSuit = c.kind === 'suit' && c.trump !== 'D' ? c.trump : null
  const z = (card: Card): ZCard => {
    const name = card.suit + (RANK_Z[card.rank] ?? card.rank)
    return swapSuit ? swapColors([name], 'D', swapSuit)[0] : name
  }
  const toProduct = (zc: ZCard): Card => {
    const name = swapSuit ? swapColors([zc], 'D', swapSuit)[0] : zc
    return { suit: name[0] as Card['suit'], rank: (RANK_P[name[1]] ?? name[1]) as Card['rank'] }
  }
  return {
    gametype,
    toProduct,
    state: {
      trump,
      self: v.me,
      hand: v.hand.map(z),
      trace: v.trace.map(([p, card]) => [p, z(card)]),
      skat: v.skat.map(z),
      points: v.points,
      blindHand: v.handGame,
      openHand: v.openCards !== null,
      soloplayerOpenCards: (v.openCards ?? []).map(z),
    },
  }
}
