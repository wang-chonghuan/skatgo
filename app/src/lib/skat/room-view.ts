// A private table (SKATGO-61) as each person sees it. The multiplayer service publishes one public
// view for everyone and, to each seat alone, that seat's own cards; these are their shapes (the service
// builds them, typed against this file). The table draws a `Game` with the viewer in seat 0, as at
// every other table in the product, so the room's view is turned by the viewer's seat.

import type { Card } from './cards'
import type { Bidding, Game, Phase, Played, Seat } from './game'
import type { Declaration } from './value'

export type RoomSeat = {
  seat: number
  /** A person who sat down, a computer (after the start), or an empty chair in the lobby. */
  kind: 'human' | 'ai' | 'empty'
  nickname: string | null
  occupied: boolean
  connected: boolean
  /** Who is playing the seat now: its person, or a computer — for good, or standing in for them. */
  control: 'human' | 'ai'
  reconnectUntil: number | null
  cardCount: number
}

export type RoomPublic = {
  roomId: string
  revision: number
  humanSeats: number
  expiresAt: number
  started: boolean
  /** Deals dealt so far. */
  deals: number
  /** Each seat's Seeger-Fabian total over the deals that ended. */
  scores: [number, number, number]
  seats: RoomSeat[]
  phase: Phase | 'lobby'
  actor: Seat | null
  turn: Seat
  dealer: Seat
  bidding: Bidding | null
  declarer: Seat | null
  bid: number
  pickedUp: boolean
  declaration: Declaration | null
  trick: Played[]
  tricks: Game['tricks']
  result: Game['result']
  ouvertHand: Card[] | null
  /** The skat, once the deal is over. */
  skat: Card[] | null
  early: Game['early'] | null
}

export type RoomPrivate = { seat: number; hand: Card[]; buried: Card[] }

/** A room seat as the viewer sees it: the viewer is 0, then clockwise. */
export const viewSeat = (seat: number, me: number): Seat => (((seat - me) % 3) + 3) % 3 as Seat
/** The room seat behind a seat of the viewer's table. */
export const roomSeat = (view: number, me: number): Seat => ((view + me) % 3) as Seat

/** A card standing in for one the viewer may not see; the table draws it face down. */
const UNSEEN: Card = { suit: 'C', rank: '7' }
const unseen = (n: number): Card[] => Array.from({ length: n }, () => UNSEEN)

/** The deal on the table as a `Game` with the viewer (`mine.seat`) in seat 0, or null in the lobby.
 *  Only for drawing — the service is what plays it. */
export function roomGame(pub: RoomPublic, mine: RoomPrivate): Game | null {
  if (pub.phase === 'lobby' || !pub.bidding) return null
  const me = mine.seat
  const v = (seat: number) => viewSeat(seat, me)
  const hands: Game['hands'] = [[], [], []]
  for (const s of pub.seats) {
    hands[v(s.seat)] = s.seat === me ? mine.hand : pub.ouvertHand && pub.declarer === s.seat ? pub.ouvertHand : unseen(s.cardCount)
  }
  // The skat: shown after the deal; the declarer knows what they put away; otherwise two face down,
  // none while the declarer holds all twelve.
  const skat = pub.skat ?? (pub.declarer === me && pub.pickedUp ? mine.buried : unseen(pub.pickedUp && pub.phase === 'skat' ? 0 : 2))
  const b = pub.bidding
  const turnPlayed = (p: Played): Played => ({ seat: v(p.seat), card: p.card })
  return {
    dealer: v(pub.dealer),
    hands,
    originalHands: [mine.hand, [], []],
    skat,
    originalSkat: [],
    phase: pub.phase,
    bidding: { ...b, speaker: v(b.speaker), listener: v(b.listener), log: b.log.map((e) => ({ ...e, seat: v(e.seat) })) },
    declarer: pub.declarer === null ? null : v(pub.declarer),
    bid: pub.bid,
    pickedUp: pub.pickedUp,
    declaration: pub.declaration,
    trick: pub.trick.map(turnPlayed),
    turn: v(pub.turn),
    tricks: pub.tricks.map((t) => ({ winner: v(t.winner), cards: t.cards.map(turnPlayed) })),
    result: pub.result,
    early: pub.early ?? undefined,
  }
}
