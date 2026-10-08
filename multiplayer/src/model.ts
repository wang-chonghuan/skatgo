import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { fullDeck, type Card } from '../../app/src/lib/skat/cards'
import {
  actor, adviceFor, aiBid, aiDeclare, applyMove, bidAction, collectTrick, deal, declare, next,
  playCard, type Game, type Move, type Seat,
} from '../../app/src/lib/skat/game'
import { declarationAdvice } from '../../app/src/lib/skat/ai'
import { seegerFabian } from '../../app/src/lib/skat/tournament'

export const GRACE_MS = 30_000
export const TTL_MS = 24 * 60 * 60 * 1000
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/)
const card = z.object({
  suit: z.enum(['C', 'S', 'H', 'D']),
  rank: z.enum(['7', '8', '9', 'Q', 'K', '10', 'A', 'J']),
}).strict()
const declaration = z.object({
  contract: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('suit'), trump: z.enum(['C', 'S', 'H', 'D']) }).strict(),
    z.object({ kind: z.literal('grand') }).strict(),
    z.object({ kind: z.literal('null') }).strict(),
  ]),
  hand: z.boolean(),
  schneiderAnnounced: z.boolean(),
  schwarzAnnounced: z.boolean(),
  ouvert: z.boolean(),
}).strict()
export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }).strict(),
  z.object({ type: z.literal('bid'), value: z.enum(['bid', 'hold', 'pass']) }).strict(),
  z.object({ type: z.literal('pickup') }).strict(),
  z.object({ type: z.literal('hand') }).strict(),
  z.object({ type: z.literal('discard'), cards: z.array(card).length(2) }).strict(),
  z.object({ type: z.literal('declare'), declaration }).strict(),
  z.object({ type: z.literal('play'), card }).strict(),
  z.object({ type: z.literal('claim') }).strict(),
  z.object({ type: z.literal('next') }).strict(),
])
export const commandSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  revision: z.number().int().nonnegative(),
  action: actionSchema,
}).strict()
export type Command = z.infer<typeof commandSchema>
export type Slot = {
  tokenHash: string | null
  session: string | null
  disconnectedAt: number | null
  autopilot: boolean
  /** The name a person sat down under (SKATGO-61); null for a computer's seat. */
  nickname: string | null
}
/** A seat's SkatZero bidding for one deal, as free play's pool stores it (SKATGO-40). */
export type Plan = { maxBid: number; decisions: string }
/** A deal as a private table takes it from the pool: deck and dealer, and every seat's bidding. */
export type PoolDeal = { dealer: Seat; deck: Card[]; plans: Record<'0' | '1' | '2', Plan> }
/** A private table (SKATGO-61): seats taken in the order people arrive, the host in seat 0; at the
 *  start the empty seats become computers for good. One deal after another, the dealer moving on,
 *  each seat's Seeger-Fabian score running across them. */
export type Snapshot = {
  schema: 2
  id: string
  revision: number
  /** People at the table, fixed at the start; 0 while it waits in the lobby. */
  humanSeats: number
  inviteHash: string
  seats: Slot[]
  game: Game | null
  /** The deal on the table's bidding plans, one per seat. */
  plans: PoolDeal['plans'] | null
  /** Deals dealt so far; the one on the table is number `deals`. */
  deals: number
  /** Deals whose score is in `scores`. */
  scored: number
  scores: [number, number, number]
  expiresAt: number
  nextActionAt: number
}
export class Rejected extends Error {}
export const hash = (s: string) => createHash('sha256').update(s).digest('hex')
export function secretEquals(a: unknown, b: string): boolean {
  return typeof a === 'string' && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)))
}
export function assertLive(s: Snapshot) {
  if (s.schema !== 2) throw new Rejected('unsupported_snapshot')
  if (s.expiresAt <= Date.now()) throw new Rejected('room_expired')
}
export function secureDeck(): Card[] {
  const deck = fullDeck()
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
const ended = (g: Game) => g.phase === 'done' || g.phase === 'passedIn'

/** A seat's action at a private table. `start` (the host, in the lobby): whoever sits down plays, and
 *  the empty seats are computers from now on. `next` (anyone at the table, once a deal is over): the
 *  next deal, dealt by the seat after the last dealer. Everything else is a move through the engine.
 *  `pick` draws a deal from the pool with the given dealer. */
export function applyAction(s: Snapshot, seat: Seat, action: Command['action'], pick: (dealer: Seat) => PoolDeal) {
  if (action.type === 'start') {
    if (seat !== 0 || s.humanSeats > 0) throw new Rejected('cannot_start')
    s.humanSeats = s.seats.filter(p => p.tokenHash).length
    s.seats.forEach(p => { if (!p.tokenHash) p.autopilot = true })
    dealNext(s, pick(2))
    return
  }
  if (action.type === 'next') {
    if (!s.game || !ended(s.game) || !s.seats[seat]?.tokenHash) throw new Rejected('cannot_deal')
    dealNext(s, pick(next(s.game.dealer)))
    return
  }
  if (!s.game) throw new Rejected('not_your_turn')
  s.game = applySeatMove(s.game, seat, action)
  scoreEnded(s)
}
function dealNext(s: Snapshot, d: PoolDeal) {
  s.game = deal(d.dealer, d.deck)
  s.plans = d.plans
  s.deals++
}
/** A deal that has just ended adds its Seeger-Fabian scores to the table's running totals, once. */
export function scoreEnded(s: Snapshot) {
  if (!s.game || !ended(s.game) || s.scored >= s.deals) return
  const add = seegerFabian(s.game)
  s.scores = s.scores.map((n, i) => n + add[i]) as Snapshot['scores']
  s.scored = s.deals
}
/** A seat's move through the engine, refused unless it is that seat's turn and the move is legal. The
 *  defenders may give up a Null at any empty trick, whoever's lead it is (SKATGO-59). */
export function applySeatMove(g: Game, seat: Seat, move: Move): Game {
  if (move.type === 'concede' ? g.declarer === null || seat === g.declarer : actor(g) !== seat) throw new Rejected('not_your_turn')
  const next = applyMove(g, move)
  if (next === g) throw new Rejected('illegal_action')
  return next
}
export function computerMove(g: Game): Game {
  if (g.phase === 'bidding') return bidAction(g, aiBid(g))
  if (g.phase === 'skat') return aiDeclare(g)
  if (g.phase === 'declare' && g.declarer !== null) {
    const hand = g.hands[g.declarer]
    const known = g.pickedUp ? [...hand, ...g.skat] : hand
    return declare(g, declarationAdvice(hand, known, g.bid, !g.pickedUp).declaration)
  }
  if (g.phase === 'play') {
    const advice = adviceFor(g, g.turn)
    if (advice) return playCard(g, advice.card)
  }
  if (g.phase === 'trickEnd') return collectTrick(g)
  return g
}
export function publicView(s: Snapshot) {
  const g = s.game
  const started = s.humanSeats > 0
  return {
    roomId: s.id, revision: s.revision, humanSeats: s.humanSeats, expiresAt: s.expiresAt,
    started, deals: s.deals, scores: s.scores,
    seats: s.seats.map((p, i) => ({
      seat: i, kind: p.tokenHash ? 'human' : started ? 'ai' : 'empty',
      nickname: p.nickname,
      occupied: !!p.tokenHash || started, connected: !!p.session,
      control: !p.tokenHash || p.autopilot ? 'ai' : 'human',
      reconnectUntil: p.disconnectedAt === null ? null : p.disconnectedAt + GRACE_MS,
      cardCount: g?.hands[i].length ?? 0,
    })),
    phase: g?.phase ?? 'lobby', actor: g ? actor(g) : null,
    dealer: g?.dealer ?? 2, bidding: g?.bidding ?? null, declarer: g?.declarer ?? null,
    bid: g?.bid ?? 0, pickedUp: g?.pickedUp ?? false, declaration: g?.declaration ?? null,
    trick: g?.trick ?? [], tricks: g?.tricks ?? [], result: g?.result ?? null,
    ouvertHand: g?.declaration?.ouvert && g.declarer !== null && (g.phase === 'play' || g.phase === 'trickEnd') ? g.hands[g.declarer] : null,
    // The skat is shown once the deal is over, as at a real table and in free play.
    skat: g?.phase === 'done' ? g.skat : null,
    early: g?.early ?? null,
  }
}
export function privateView(s: Snapshot, seat: number) {
  return {
    seat, hand: s.game?.hands[seat] ?? [],
    buried: s.game?.declarer === seat && s.game.pickedUp ? s.game.skat : [],
  }
}
export type PublicView = ReturnType<typeof publicView>
export type PrivateView = ReturnType<typeof privateView>
