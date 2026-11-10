import { type Card, sameCard } from '../../../app/src/lib/skat/cards'
import { type Game, type Move, discard, mayAnnounce, pickUpSkat, roleOf } from '../../../app/src/lib/skat/game'
import { type Logged, type SeatPlan, POSITION, computerTurn, declaration, raw } from '../computers'
import { HAND_MODES, PICKUP_MODES, bidIndex, bidValueTable, maxBid, type SeatBidding } from '../skatzero/bidding'
import { discardPairs } from '../skatzero/encode'
import { type PlayerView, type Policy, toZ } from '../skatzero/policy'
import { type Persona, random } from './config'

export type DecisionAudit = {
  phase: 'bidding' | 'pickup' | 'discard' | 'contract' | 'card'
  role: 'declarer' | 'defender'; contract: string; trick: number
  candidates: { action: string; value: number }[]
  selected: string; rank: number; loss: number; severe: boolean
  estimateOffset?: number
  candidateCount?: number
}
type Candidate<T> = { action: T; key: string; value: number }
type Context = Pick<DecisionAudit, 'phase' | 'role' | 'contract' | 'trick'>
type DetailedBidding = SeatBidding & { detail: { pickupPen: number[]; handMax: number[] } }
const clamp = (x: number) => Math.max(0, Math.min(1, x))

/** Rank depth is dimensionless; model losses are audited but never treated as points/chances. */
function select<T>(candidates: Candidate<T>[], error: number, severity: number, rand: () => number,
  audit: DecisionAudit[], context: Context): T {
  const ranked = [...candidates].sort((a, b) => b.value - a.value)
  if (!ranked.length || ranked.some((c) => !Number.isFinite(c.value))) throw new Error('persona_invalid_evaluation')
  const worse = ranked.filter((c) => c.value < ranked[0].value)
  let chosen = ranked[0]
  let severe = false
  if (worse.length && rand() < clamp(error)) {
    severe = rand() < severity
    const top = Math.max(1, Math.ceil(worse.length * 0.3))
    const from = severe ? Math.min(worse.length - 1, top) : 0
    const to = severe ? Math.max(from + 1, Math.ceil(worse.length * 0.85)) : top
    chosen = worse[from + Math.floor(rand() * (to - from))]
  }
  audit.push({ ...context, candidates: ranked.map((c) => ({ action: c.key, value: c.value })),
    selected: chosen.key, rank: ranked.indexOf(chosen), loss: ranked[0].value - chosen.value, severe })
  return chosen.action
}

export function strengthDecisions(base: Policy, p: Persona, seed: string, audit: DecisionAudit[]) {
  const s = p.play.strength!
  const form = (random(`${seed.split('|game|')[0]}|form`)() * 2 - 1) * p.play.form
  const cards = random(`${seed}|cards-v2`)
  const skat = random(`${seed}|skat-v2`)
  const bid = random(`${seed}|bid-v2`)
  const context = (phase: Context['phase'], contract = '', trick = 0, role: Context['role'] = 'declarer'): Context =>
    ({ phase, contract, trick, role })

  function plan(b: DetailedBidding): SeatPlan {
    const offset = (bid() * 2 - 1) * s.bidNoise
    const threshold = p.play.bidThreshold + offset
    const maximum = Math.max(maxBid(b.detail.handMax, threshold), maxBid(b.detail.pickupPen, threshold))
    audit.push({ ...context('bidding'), candidates: [{ action: 'threshold', value: p.play.bidThreshold }],
      selected: String(maximum), rank: 0, loss: 0, estimateOffset: offset, severe: false })
    const choices = new Map<number, ReturnType<SeatPlan['skatOrHand']>>()
    return { maxBid: maximum, skatOrHand: (value) => {
      if (!choices.has(value)) {
        const i = bidIndex(value)
        const options: Candidate<ReturnType<SeatPlan['skatOrHand']>>[] = [
          { action: { pickup: true }, key: 'pickup', value: b.pickup[i] },
          ...HAND_MODES.map((mode, n) => ({ action: { pickup: false as const, mode }, key: mode, value: b.hand[n][i] })),
        ]
        // Bad-looking Hand alternatives are limited to the leading alternatives, not every contract.
        choices.set(value, select(options.slice(0, 1).concat(options.slice(1).sort((a, b) => b.value - a.value).slice(0, 2)),
          s.pickupError + form, s.severeError, skat, audit, context('pickup')))
      }
      return choices.get(value)!
    } }
  }

  const policy: Policy = { ...base, release: async () => {}, choose: async (v: PlayerView) => {
    const values = await base.ranked(v)
    const contract = v.contract.kind === 'suit' ? v.contract.trump : v.contract.kind
    const error = v.me === 0 ? s.declarerError : s.defenderError
    const complexity = values.length <= 2 ? 0.65 : values.length <= 4 ? 0.85 : 1
    return select(values.map((c) => ({ action: c.card, key: raw(c.card), value: c.value })),
      (error + form + (v.contract.kind === 'null' ? p.play.nullWeakness : 0)) * complexity,
      s.severeError, cards, audit, context('card', contract, Math.floor(v.trace.length / 3) + 1, v.me === 0 ? 'declarer' : 'defender'))
  } }

  async function pickup(g: Game): Promise<Logged[]> {
    const at = pickUpSkat(g)
    const hand12 = at.hands[0]
    const position = POSITION[roleOf(0, at.dealer)]
    const options: Candidate<{ mode: typeof PICKUP_MODES[number]; put: Card[]; audit: DecisionAudit[] }>[] = []
    for (const mode of PICKUP_MODES) {
      const contract = declaration(mode).contract
      const view: PlayerView = { contract, me: 0, hand: hand12, skat: [], trace: [], points: [0, 0],
        handGame: true, openCards: mode === 'NO' ? [] : null }
      const { gametype, state, toProduct } = toZ(view)
      const pairs = discardPairs(state.hand)
      const evaluated = await base.score(gametype, { ...state, blindHand: false, discard: { pos: (3 - position) % 3 } })
      if (evaluated.values.length !== pairs.length) throw new Error('persona_discard_shape')
      const discards = pairs.map((pair, n) => ({
        action: pair.map(toProduct), key: pair.map(toProduct).map(raw).join(','),
        value: evaluated.values[n],
      })).filter((c) => mayAnnounce(discard(at, c.action), declaration(mode)))
      if (!discards.length) continue
      // Choose only within this contract's scale, then compare expected bidding rewards across contracts.
      const discardAudit: DecisionAudit[] = []
      const put = select(discards, s.discardError + form, s.severeError, skat, discardAudit, context('discard', mode))
      const selected = discards.find((c) => c.action.every((card, n) => sameCard(card, put[n])))!
      const value = bidValueTable(base.tables, hand12.map(raw), mode, selected.value, null)[bidIndex(at.bid)]
      options.push({ action: { mode, put, audit: discardAudit }, key: mode, value })
    }
    const chosen = select(options, s.contractError + form, s.severeError, skat, audit, context('contract'))
    audit.push(...chosen.audit)
    const moves: Move[] = []
    moves.push({ type: 'pickup' }, { type: 'discard', cards: chosen.put })
    moves.push({ type: 'declare', declaration: declaration(chosen.mode) })
    return moves.map((move) => ({ seat: 0 as const, move }))
  }

  async function turn(g: Game, own: SeatPlan): Promise<Logged[]> {
    if (g.phase === 'skat' && !g.pickedUp && own.skatOrHand(g.bid).pickup) return pickup(g)
    return computerTurn(g, 0, own, policy)
  }
  return { policy, plan, turn }
}
