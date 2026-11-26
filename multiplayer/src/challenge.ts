import { createHash, randomInt } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import express from 'express'
import { z } from 'zod'
import { type Card, sameCard } from '../../app/src/lib/skat/cards'
import { CHALLENGE_DEALS, CHALLENGE_KINDS, type ChallengeGame, type ChallengeKind, challengeStart, declarationOf, ownSlice } from '../../app/src/lib/skat/challenge'
import { actor, discard, pickUpSkat, roleOf, type Game, type Move, type Seat } from '../../app/src/lib/skat/game'
import { PLAYER, auctionOf, seatView, summarize } from '../../app/src/lib/skat/tournament'
import { ComputerFailed, type Logged, POSITION, advance, card, decide, judgePlays, playsOf, raw, replayLog, reviewOf } from './computers'
import { deckOf, open, seal, tokenKey } from './free'
import { actionSchema, applySeatMove, Rejected, secretEquals } from './model'
import { discardFor } from './skatzero/bidding'
import { type Policy, viewOf } from './skatzero/policy'

// Hard hands on the server (SKATGO-248): a deal of the challenge pool, the game set, the player declaring in seat 0
// against two SkatZero defenders. As free play (free.ts), the server keeps nothing: the deal as dealt and every move
// travel in a sealed token. Played again, the player's ten cards and the skat stay and the other twenty are dealt anew.
// Counted nowhere — no record, no XP, no board, no League (grill Q2).

/** One deal of the pool: how it was dealt, the game, and SkatZero's rate over the other twenty cards' lies — for the bad
 *  seat also from forehand (`front`). */
export type ChallengeDeal = { dealer: Seat; deck: string; game: ChallengeGame; rate: number; front?: number }
export type ChallengePool = { version: string; kinds: Record<ChallengeKind, ChallengeDeal[]> }

const dealSchema = z.object({
  dealer: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  deck: z.string().regex(/^([CSHD][789TJQKA] ){31}[CSHD][789TJQKA]$/),
  game: z.enum(['C', 'S', 'H', 'D', 'G', 'N']),
  rate: z.number().min(0).max(1),
  front: z.number().min(0).max(1).optional(),
}).strict()

/** The pool (multiplayer/skatzero/challenge-pool.json, made by scripts/make-challenge-pool.ts), checked as it loads:
 *  every kind there, each deck a whole deck. Its version is its content's hash, so a token outlives no change. */
export async function loadChallengePool(dir: URL): Promise<ChallengePool> {
  const text = await readFile(new URL('challenge-pool.json', dir), 'utf8')
  const raw = JSON.parse(text) as { kinds: Record<string, unknown[]> }
  const kinds = {} as Record<ChallengeKind, ChallengeDeal[]>
  for (const kind of CHALLENGE_KINDS) {
    const deals = z.array(dealSchema).min(1).max(CHALLENGE_DEALS).parse(raw.kinds[kind])
    for (const d of deals) if (new Set(d.deck.split(' ')).size !== 32) throw new Error('challenge_pool_deck')
    kinds[kind] = deals
  }
  return { version: createHash('sha256').update(text).digest('hex').slice(0, 12), kinds }
}

/** The same deal with the other twenty cards dealt anew: seat 0's ten and the skat where they were. */
export function redeal(dealer: Seat, deck: Card[], random: (n: number) => number = randomInt): Card[] {
  const [a, b] = ownSlice(dealer)
  const others = deck.filter((_, i) => (i < a || i >= b) && i < 30)
  for (let i = others.length - 1; i > 0; i--) {
    const j = random(i + 1)
    ;[others[i], others[j]] = [others[j], others[i]]
  }
  const out: Card[] = []
  let k = 0
  for (let i = 0; i < 30; i++) out.push(i >= a && i < b ? deck[i] : others[k++])
  return [...out, deck[30], deck[31]]
}

/** SkatZero's moves in a challenge: as the declarer (the AI's own run of the deal) the pick-up, its two cards for the
 *  set game and the declaration; as a defender, its card. */
export function challengeTurn(policy: Policy, game: ChallengeGame) {
  return async (g: Game): Promise<Logged[]> => {
    const seat = actor(g)!
    if (g.phase === 'skat' && seat === g.declarer) {
      const picked = pickUpSkat(g)
      const put = (await decide(discardFor(policy, picked.hands[seat].map(raw), POSITION[roleOf(seat, g.dealer)], game))).map(card)
      return [{ seat, move: { type: 'pickup' } }, { seat, move: { type: 'discard', cards: put } }, { seat, move: { type: 'declare', declaration: declarationOf(game) } }]
    }
    if (g.phase !== 'play') throw new ComputerFailed('computer_unexpected_phase')
    return [{ seat, move: { type: 'play', card: await decide(policy.choose(viewOf(g, seat))) } }]
  }
}

/** The deal played out by SkatZero in all three seats, the player's included, with the set game. */
export async function aiPlays(policy: Policy, dealer: Seat, deck: Card[], game: ChallengeGame): Promise<Game> {
  const end = await advance(challengeStart(dealer, deck), [], challengeTurn(policy, game), undefined, true)
  if (end.phase !== 'done') throw new ComputerFailed('ai_unfinished')
  return end
}

const TOKEN_LABEL = 'skatgo-challenge/1'
const TOKEN_MS = 24 * 60 * 60 * 1000
type Token = { v: 1; pool: string; kind: ChallengeKind; n: number; dealer: Seat; deck: string; t: number; log: Logged[] }

const deckText = (deck: Card[]) => deck.map(raw).join(' ')

export function challengeRoutes(admissionKey: string, ready: () => boolean, policy: () => Policy | null, pool: () => ChallengePool | null) {
  const key = tokenKey(admissionKey, TOKEN_LABEL)
  const router = express.Router()
  router.use(express.json({ limit: '64kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready() || !policy() || !pool()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), admissionKey)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })

  const run = (work: (body: unknown) => Promise<unknown>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json(await work(req.body))
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else if (e instanceof ComputerFailed) {
        console.error(JSON.stringify({ event: 'challenge_computer_failed', reason: e.message }))
        res.status(503).json({ error: 'computer_unavailable' })
      } else {
        console.error('challenge_failed')
        res.status(503).json({ error: 'unavailable' })
      }
    }
  }

  const gameOf = (t: Token) => pool()!.kinds[t.kind][t.n - 1].game

  async function reply(t: Token, g: Game, steps: Game[]) {
    await advance(g, t.log, challengeTurn(policy()!, gameOf(t)), steps)
    return { token: seal(key, t), steps: steps.map(seatView), revision: t.log.length, game: gameOf(t), of: pool()!.kinds[t.kind].length }
  }

  function opened(token: string): Token {
    const t = open<Token>(key, token)
    const p = pool()!
    if (t.v !== 1 || t.pool !== p.version || !CHALLENGE_KINDS.includes(t.kind) || !(t.n >= 1 && t.n <= p.kinds[t.kind].length)) throw new Rejected('game_expired')
    if (Date.now() - t.t > TOKEN_MS) throw new Rejected('game_expired')
    return t
  }
  const startOf = (t: Token) => challengeStart(t.dealer, deckOf(t.deck))

  // A deal of a kind, by its number from 1 (the easiest).
  const newInput = z.object({ kind: z.enum(CHALLENGE_KINDS), n: z.number().int().min(1).max(CHALLENGE_DEALS) }).strict()
  router.post('/new', run(async (body) => {
    const i = newInput.parse(body)
    const p = pool()!
    const d = p.kinds[i.kind][i.n - 1]
    if (!d) throw new Rejected('no_such_deal')
    const t: Token = { v: 1, pool: p.version, kind: i.kind, n: i.n, dealer: d.dealer, deck: d.deck, t: Date.now(), log: [] }
    const g = startOf(t)
    return reply(t, g, [g])
  }))

  // The player's move. The game is the challenge's: no Hand, no other declaration; once two cards are put away, the
  // server declares it for them.
  const actInput = z.object({ token: z.string().max(20_000), revision: z.number().int().nonnegative(), action: actionSchema }).strict()
  router.post('/act', run(async (body) => {
    const i = actInput.parse(body)
    const move = i.action as Move
    if (!['pickup', 'discard', 'play', 'claim', 'concede'].includes(move.type)) throw new Rejected('illegal_action')
    const t = opened(i.token)
    if (i.revision !== t.log.length) throw new Rejected('stale_revision')
    let g = replayLog(t.dealer, deckOf(t.deck), t.log, startOf(t))
    if (actor(g) !== PLAYER && move.type !== 'concede') throw new Rejected('not_your_turn')
    g = applySeatMove(g, PLAYER, move)
    t.log.push({ seat: PLAYER, move })
    const steps = [g]
    if (g.phase === 'declare') {
      const declared: Move = { type: 'declare', declaration: declarationOf(gameOf(t)) }
      g = applySeatMove(g, PLAYER, declared)
      t.log.push({ seat: PLAYER, move: declared })
      steps.push(g)
    }
    return reply(t, g, steps)
  }))

  // The finished deal's review: its replay, where SkatZero would have played another card, and SkatZero's own run of the
  // same deal with the same game in the player's seat.
  const tokenInput = z.object({ token: z.string().max(20_000) }).strict()
  router.post('/review', run(async (body) => {
    const i = tokenInput.parse(body)
    const t = opened(i.token)
    const deck = deckOf(t.deck)
    const end = replayLog(t.dealer, deck, t.log, startOf(t))
    if (end.phase !== 'done') throw new Rejected('not_finished')
    const ai = await aiPlays(policy()!, t.dealer, deck, gameOf(t))
    return reviewOf(end, await judgePlays(policy()!, playsOf(t.dealer, deck, t.log, startOf(t))), { ai: summarize(ai), aiAuction: auctionOf(ai) })
  }))

  // Once more: the same ten and skat, the other twenty dealt anew — never as they just lay.
  router.post('/again', run(async (body) => {
    const i = tokenInput.parse(body)
    const t = opened(i.token)
    const was = deckOf(t.deck)
    let deck = redeal(t.dealer, was)
    while (deck.every((c, k) => sameCard(c, was[k]))) deck = redeal(t.dealer, was)
    const next: Token = { ...t, deck: deckText(deck), t: Date.now(), log: [] }
    const g = startOf(next)
    return reply(next, g, [g])
  }))

  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
