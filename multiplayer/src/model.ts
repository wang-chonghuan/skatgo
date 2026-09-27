import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { fullDeck, type Card } from '../../app/src/lib/skat/cards'
import {
  actor, adviceFor, aiBid, aiDeclare, bidAction, collectTrick, deal, declare,
  discard, pickUpSkat, playCard, playHand, type Game, type Seat,
} from '../../app/src/lib/skat/game'
import { declarationAdvice } from '../../app/src/lib/skat/ai'

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
}
export type Snapshot = {
  schema: 1
  id: string
  revision: number
  humanSeats: number
  inviteHash: string
  seats: Slot[]
  game: Game | null
  expiresAt: number
  nextActionAt: number
}
export class Rejected extends Error {}
export const hash = (s: string) => createHash('sha256').update(s).digest('hex')
export function secretEquals(a: unknown, b: string): boolean {
  return typeof a === 'string' && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)))
}
export function assertLive(s: Snapshot) {
  if (s.schema !== 1) throw new Rejected('unsupported_snapshot')
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
export function applyAction(s: Snapshot, seat: Seat, action: Command['action']): Game {
  if (action.type === 'start') {
    if (seat !== 0 || s.game || s.seats.slice(0, s.humanSeats).some(p => !p.session)) {
      throw new Rejected('cannot_start')
    }
    return deal(2, secureDeck())
  }
  const g = s.game
  if (!g || actor(g) !== seat) throw new Rejected('not_your_turn')
  let next = g
  switch (action.type) {
    case 'bid': {
      if (g.phase !== 'bidding') break
      const valid = action.value === 'pass' ||
        (g.bidding.awaiting === 'listener' ? action.value === 'hold' : action.value === 'bid')
      if (valid) next = bidAction(g, action.value)
      break
    }
    case 'pickup':
      if (!g.pickedUp) next = pickUpSkat(g)
      break
    case 'hand': next = playHand(g); break
    case 'discard': next = discard(g, action.cards); break
    case 'declare': next = declare(g, action.declaration); break
    case 'play': next = playCard(g, action.card); break
  }
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
  return {
    roomId: s.id, revision: s.revision, humanSeats: s.humanSeats, expiresAt: s.expiresAt,
    seats: s.seats.map((p, i) => ({
      seat: i, kind: i < s.humanSeats ? 'human' : 'ai',
      occupied: i >= s.humanSeats || !!p.tokenHash, connected: !!p.session,
      control: i >= s.humanSeats || p.autopilot ? 'ai' : 'human',
      reconnectUntil: p.disconnectedAt === null ? null : p.disconnectedAt + GRACE_MS,
      cardCount: g?.hands[i].length ?? 0,
    })),
    phase: g?.phase ?? 'lobby', actor: g ? actor(g) : null,
    dealer: g?.dealer ?? 2, bidding: g?.bidding ?? null, declarer: g?.declarer ?? null,
    bid: g?.bid ?? 0, pickedUp: g?.pickedUp ?? false, declaration: g?.declaration ?? null,
    trick: g?.trick ?? [], tricks: g?.tricks ?? [], result: g?.result ?? null,
    ouvertHand: g?.declaration?.ouvert && g.declarer !== null ? g.hands[g.declarer] : null,
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
