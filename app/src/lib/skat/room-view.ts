// A private table (SKATGO-61) as each person sees it. The multiplayer service publishes one public
// view for everyone and, to each seat alone, that seat's own cards; these are their shapes (the service
// builds them, typed against this file). The table draws a `Game` with the viewer in seat 0, as at
// every other table in the product, so the room's view is turned by the viewer's seat.

import type { Card } from './cards'
import type { Bidding, Game, Phase, Played, Seat } from './game'
import type { DealSummary } from './tournament'
import type { Declaration } from './value'

export type RoomSeat = {
  seat: number
  /** A person's seat, a computer's, or — while the room waits for its first deal (SKATGO-163) — an empty one. */
  kind: 'human' | 'ai' | 'empty'
  nickname: string | null
  /** The room's host: who may take a person out. */
  host: boolean
  connected: boolean
  /** Who is playing the seat now: its person, or a computer — for good, or standing in for them. */
  control: 'human' | 'ai'
  /** A newcomer who plays from the next deal; a computer finishes this one for them. */
  joining: boolean
  reconnectUntil: number | null
  cardCount: number
}

/** A finished deal in the room's statistics (SKATGO-165): its summary by room seat, and who sat where — a person's name,
 *  or null where a computer played the deal. */
export type RoomDeal = { summary: DealSummary; names: (string | null)[] }

export type RoomPublic = {
  /** The room's number. */
  roomId: string
  revision: number
  /** The revision of the last change to the game itself (SKATGO-164): what changed besides — someone's connection, a seat —
   *  leaves it as it was. */
  played: number
  expiresAt: number
  /** Deals dealt so far; 0 while the room waits for the host to start. */
  deals: number
  /** Each seat's Seeger-Fabian total over the deals that ended — a newcomer's since they sat down. */
  scores: [number, number, number]
  /** Every deal scored in the room, the first first. */
  history: RoomDeal[]
  seats: RoomSeat[]
  phase: Phase
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

/** The deal on the table as a `Game` with the viewer (`mine.seat`) in seat 0, or null before one is dealt.
 *  Only for drawing — the service is what plays it. */
export function roomGame(pub: RoomPublic, mine: RoomPrivate): Game | null {
  if (!pub.bidding) return null
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
