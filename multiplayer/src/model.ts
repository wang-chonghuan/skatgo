import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { fullDeck, type Card } from '../../app/src/lib/skat/cards'
import {
  actor, adviceFor, aiBid, aiDeclare, applyMove, bidAction, collectTrick, deal, declare, mayAnnounce, next,
  playCard, type Game, type Move, type Seat,
} from '../../app/src/lib/skat/game'
import { declarationAdvice } from '../../app/src/lib/skat/ai'
import { seegerFabian } from '../../app/src/lib/skat/tournament'
import type { RoomPrivate, RoomPublic } from '../../app/src/lib/skat/room-view'

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
  // Before the first deal (SKATGO-163), the host gives an empty seat to the AI (`on`), or takes it back for a person to
  // come in; then starts the game.
  z.object({ type: z.literal('computer'), seat: z.number().int().min(0).max(2), on: z.boolean() }).strict(),
  z.object({ type: z.literal('start') }).strict(),
  // The host takes a person out of the room (SKATGO-163); they may come back with its number.
  z.object({ type: z.literal('kick'), seat: z.number().int().min(0).max(2) }).strict(),
  // A person gives up their seat and leaves the room.
  z.object({ type: z.literal('leave') }).strict(),
  // `to`: the number a speaker jumps to (SKATGO-87); the engine decides whether it may be named now.
  z.object({ type: z.literal('bid'), value: z.enum(['bid', 'hold', 'pass']), to: z.number().int().optional() }).strict(),
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
/** A room's own actions (SKATGO-163), which no other table takes. */
export const roomOnly = (a: Command['action']) => a.type === 'kick' || a.type === 'leave' || a.type === 'computer' || a.type === 'start'
export type Slot = {
  /** The account whose seat this is (`user:<id>`, SKATGO-163); null for a computer's seat, and before the first deal
   *  for an empty one, waiting for a person (autopilot off). */
  account: string | null
  /** The account's name when it sat down — the leaderboard's (SKATGO-90/126); null for a computer's seat. */
  nickname: string | null
  session: string | null
  disconnectedAt: number | null
  /** A computer plays the seat: always a computer's, and a person's while they are away or wait for their first deal. */
  autopilot: boolean
  /** The deal a newcomer plays from (SKATGO-163): who sits down while a deal is played starts with the next. */
  joinsAt: number | null
}
/** A seat's SkatZero bidding for one deal, as free play's pool stores it (SKATGO-40). */
export type Plan = { maxBid: number; decisions: string }
/** A deal as a private table takes it from the pool: deck and dealer, and every seat's bidding. */
export type PoolDeal = { dealer: Seat; deck: Card[]; plans: Record<'0' | '1' | '2', Plan> }
/** A private room (SKATGO-61, a room since SKATGO-163): its number is its id. It waits first, with no deal (`deals` 0):
 *  people come in with the number, the host gives the seats nobody takes to computers and starts. Then one deal after
 *  another, the dealer moving on, each seat's Seeger-Fabian score running across them; a person who comes in later takes
 *  a computer's seat, or the seat of someone away, from the next deal and from 0. */
export type Snapshot = {
  schema: 3
  /** The room's number, six digits. */
  id: string
  revision: number
  /** The revision written by the last change to the game itself (SKATGO-117): a move made at or after
   *  it is not stale. Absent on tables stored before, where every change counts. */
  played?: number
  /** The host's account (SKATGO-117): who opened the room, or whom it passed to when they left (SKATGO-163). */
  host: string | null
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
  if (s.schema !== 3) throw new Rejected('unsupported_snapshot')
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

/** A computer's seat. */
export const computerSeat = (): Slot => ({ account: null, nickname: null, session: null, disconnectedAt: null, autopilot: true, joinsAt: null })
/** An empty seat, before the first deal: nobody's yet. */
const emptySeat = (): Slot => ({ ...computerSeat(), autopilot: false })
const isEmpty = (p: Slot) => p.account === null && !p.autopilot
/** Whether the room still waits for its first deal (SKATGO-163). */
export const waiting = (s: Snapshot) => s.deals === 0

/** A new room (SKATGO-163): the host in seat 0, the others empty, waiting to start. */
export function newRoom(id: string, host: string, nickname: string, now = Date.now()): Snapshot {
  return {
    schema: 3, id, revision: 0, played: 0, host, game: null, plans: null, deals: 0, scored: 0, scores: [0, 0, 0],
    expiresAt: now + TTL_MS, nextActionAt: now,
    seats: [{ ...emptySeat(), account: host, nickname }, emptySeat(), emptySeat()],
  }
}

/** The seat a newcomer takes: an empty one first, then a computer's, else that of a person away past the grace a
 *  computer gives them (GRACE_MS) — the one away longest. */
export function freeSeat(s: Snapshot, now = Date.now()): number {
  const empty = s.seats.findIndex(isEmpty)
  if (empty >= 0) return empty
  const computer = s.seats.findIndex(p => p.account === null)
  if (computer >= 0) return computer
  let seat = -1
  s.seats.forEach((p, i) => {
    if (!p.session && p.disconnectedAt !== null && now >= p.disconnectedAt + GRACE_MS
      && (seat < 0 || p.disconnectedAt < s.seats[seat].disconnectedAt!)) seat = i
  })
  return seat
}

/** An account sits down (SKATGO-163): while a deal is played a computer finishes it and they play from the next;
 *  between deals at once. Their total starts at 0. */
export function claimSeat(s: Snapshot, account: string, nickname: string, session: string, now = Date.now()): number {
  const seat = freeSeat(s, now)
  if (seat < 0) throw new Rejected('room_full')
  const playing = !!s.game && !ended(s.game)
  const before = s.seats[seat].account
  s.seats[seat] = { account, nickname, session, disconnectedAt: null, autopilot: playing, joinsAt: playing ? s.deals + 1 : null }
  // The seat of a host who was away: the role passes on as when they leave, to the newcomer only if nobody else is here.
  if (before !== null && before === s.host) {
    s.host = [1, 2].map(k => s.seats[(seat + k) % 3]).find(p => p.account !== null)?.account ?? account
  }
  if (!playing) s.scores[seat] = 0
  s.expiresAt = now + TTL_MS
  return seat
}

/** A person's seat to a computer — or, while the room waits, empty again: they were taken out, or left. The host's role
 *  passes to the next person in seat order; with nobody left the room has no host, and closes. */
function vacate(s: Snapshot, seat: number) {
  const gone = s.seats[seat].account
  s.seats[seat] = waiting(s) ? emptySeat() : computerSeat()
  if (gone !== null && gone === s.host) {
    const heir = [1, 2].map(k => s.seats[(seat + k) % 3]).find(p => p.account !== null)
    s.host = heir?.account ?? null
  }
}

/** Whether nobody is left in the room. */
export const emptyRoom = (s: Snapshot) => s.seats.every(p => p.account === null)

/** A seat's action in a room. While it waits, the host's `computer` (an empty seat to a computer, or back) and `start`
 *  (every seat taken: the first deal). `next` (anyone in the room, once a deal is over): the next deal, dealt by the seat
 *  after the last dealer. `kick` (the host): a person's seat to a computer. `leave`: one's own. Everything else is a move
 *  through the engine. `pick` draws a deal from the pool with the given dealer. */
export function applyAction(s: Snapshot, seat: Seat, action: Command['action'], pick: (dealer: Seat) => PoolDeal) {
  const host = !!s.host && s.seats[seat].account === s.host
  if (action.type === 'computer') {
    const p = s.seats[action.seat]
    if (!host || !waiting(s) || p.account !== null) throw new Rejected('cannot_seat')
    s.seats[action.seat] = action.on ? computerSeat() : emptySeat()
    return
  }
  if (action.type === 'start') {
    if (!host || !waiting(s) || s.seats.some(isEmpty)) throw new Rejected('cannot_start')
    // Seat 2 deals, so the host in seat 0 leads the first deal.
    dealNext(s, pick(2))
    return
  }
  if (action.type === 'next') {
    if (!s.game || !ended(s.game) || !s.seats[seat]?.account) throw new Rejected('cannot_deal')
    dealNext(s, pick(next(s.game.dealer)))
    return
  }
  if (action.type === 'kick') {
    if (!host || action.seat === seat || !s.seats[action.seat].account) throw new Rejected('cannot_kick')
    vacate(s, action.seat)
    return
  }
  if (action.type === 'leave') {
    vacate(s, seat)
    return
  }
  if (!s.game) throw new Rejected('not_your_turn')
  refuseUnlawful(s.game, action)
  s.game = applySeatMove(s.game, seat, action)
  scoreEnded(s)
}
function dealNext(s: Snapshot, d: PoolDeal) {
  s.game = deal(d.dealer, d.deck)
  s.plans = d.plans
  s.deals++
  // Who waited for this deal plays it, from 0; someone away by now is stood in for by a computer.
  s.seats.forEach((p, i) => {
    if (p.joinsAt === null || p.joinsAt > s.deals) return
    p.joinsAt = null
    p.autopilot = p.session === null
    s.scores[i] = 0
  })
}
/** A deal that has just ended adds its Seeger-Fabian scores to the table's running totals, once. */
export function scoreEnded(s: Snapshot) {
  if (!s.game || !ended(s.game) || s.scored >= s.deals) return
  const add = seegerFabian(s.game)
  s.scores = s.scores.map((n, i) => n + add[i]) as Snapshot['scores']
  s.scored = s.deals
}
/** A person's new move: a declaration the rules do not allow is refused (ISkO 3.4.2–3.4.4, SKATGO-98). Only
 *  new moves are checked; a game recorded before replays as it was played. */
export function refuseUnlawful(g: Game, move: Move | Command['action']) {
  if (move.type === 'declare' && !mayAnnounce(g, move.declaration)) throw new Rejected('illegal_action')
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
export function publicView(s: Snapshot): RoomPublic {
  const g = s.game
  return {
    roomId: s.id, revision: s.revision, expiresAt: s.expiresAt, deals: s.deals, scores: s.scores,
    seats: s.seats.map((p, i) => ({
      seat: i, kind: p.account ? 'human' : isEmpty(p) ? 'empty' : 'ai',
      nickname: p.nickname,
      host: p.account !== null && p.account === s.host,
      connected: !!p.session,
      control: !p.account || p.autopilot ? 'ai' : 'human',
      joining: p.joinsAt !== null,
      reconnectUntil: p.disconnectedAt === null ? null : p.disconnectedAt + GRACE_MS,
      cardCount: g?.hands[i].length ?? 0,
    })),
    phase: g?.phase ?? 'done', actor: g ? actor(g) : null, turn: g?.turn ?? 0,
    dealer: g?.dealer ?? 2, bidding: g?.bidding ?? null, declarer: g?.declarer ?? null,
    bid: g?.bid ?? 0, pickedUp: g?.pickedUp ?? false, declaration: g?.declaration ?? null,
    trick: g?.trick ?? [], tricks: g?.tricks ?? [], result: g?.result ?? null,
    ouvertHand: g?.declaration?.ouvert && g.declarer !== null && (g.phase === 'play' || g.phase === 'trickEnd') ? g.hands[g.declarer] : null,
    // The skat is shown once the deal is over, as at a real table and in free play.
    skat: g?.phase === 'done' ? g.skat : null,
    early: g?.early ?? null,
  }
}
/** A seat's own cards — none for a newcomer waiting for their first deal, whose seat a computer still plays. */
export function privateView(s: Snapshot, seat: number): RoomPrivate {
  const waiting = s.seats[seat]?.joinsAt !== null
  return {
    seat, hand: waiting ? [] : s.game?.hands[seat] ?? [],
    buried: !waiting && s.game?.declarer === seat && s.game.pickedUp ? s.game.skat : [],
  }
}
export type PublicView = ReturnType<typeof publicView>
export type PrivateView = ReturnType<typeof privateView>
