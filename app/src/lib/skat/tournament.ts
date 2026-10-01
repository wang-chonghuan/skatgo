// The daily tournament's rules on top of the engine (SKATGO-35): what one player is allowed to see of a
// deal the server owns, how that view becomes a table the course's GameTable can draw, and how a deal is
// scored. Pure, like the rest of lib/skat: the multiplayer service, which owns the cards, and the
// browser, which draws them, read the same definitions.

import type { Card } from './cards'
import type { Bidding, Game, Phase, Played, Seat } from './game'
import type { Declaration } from './value'

/** Deals in one day's tournament. */
export const DAILY_DEALS = 12

/** New deals start at midnight in this time zone. */
export const DAILY_TIME_ZONE = 'Europe/Berlin'

/** The player's seat in every tournament deal. */
export const PLAYER: Seat = 0

/** One deal as seat 0 may see it. Nothing here comes from another hand, the face-down skat, or another
 *  deal: opponents are counted, not shown — except an Ouvert declarer's hand, which is on the table. */
export type SeatView = {
  dealer: Seat
  phase: Phase
  hand: Card[]
  /** Cards in each seat's hand. */
  counts: [number, number, number]
  /** The skat's cards once seat 0 may know them (declarer who picked it up, or the deal is over). */
  skat: Card[] | null
  skatCount: number
  bidding: Bidding
  declarer: Seat | null
  bid: number
  pickedUp: boolean
  declaration: Declaration | null
  trick: Played[]
  turn: Seat
  tricks: Game['tricks']
  result: Game['result']
  ouvertHand: Card[] | null
}

export function seatView(g: Game): SeatView {
  const knowsSkat = g.phase === 'done' || (g.declarer === PLAYER && g.pickedUp)
  const ouvert = g.declaration?.ouvert && g.declarer !== null && g.declarer !== PLAYER && (g.phase === 'play' || g.phase === 'trickEnd')
  return {
    dealer: g.dealer,
    phase: g.phase,
    hand: g.hands[PLAYER],
    counts: [g.hands[0].length, g.hands[1].length, g.hands[2].length],
    skat: knowsSkat ? g.skat : null,
    skatCount: g.skat.length,
    bidding: g.bidding,
    declarer: g.declarer,
    bid: g.bid,
    pickedUp: g.pickedUp,
    declaration: g.declaration,
    trick: g.trick,
    turn: g.turn,
    tricks: g.tricks,
    result: g.result,
    ouvertHand: ouvert ? g.hands[g.declarer!] : null,
  }
}

/** A card standing in for one nobody at this seat may see; the table draws it face down. */
const UNSEEN: Card = { suit: 'C', rank: '7' }
const unseen = (n: number): Card[] => Array.from({ length: n }, () => UNSEEN)

/** The view as a `Game` the table can render: the hidden cards are face-down stand-ins. Only for
 *  drawing — the server is what plays it. */
export function gameFromView(v: SeatView): Game {
  const hands: Game['hands'] = [v.hand, unseen(v.counts[1]), unseen(v.counts[2])]
  if (v.ouvertHand && v.declarer !== null) hands[v.declarer] = v.ouvertHand
  return {
    dealer: v.dealer,
    hands,
    originalHands: [v.hand, [], []],
    skat: v.skat ?? unseen(v.skatCount),
    originalSkat: [],
    phase: v.phase,
    bidding: v.bidding,
    declarer: v.declarer,
    bid: v.bid,
    pickedUp: v.pickedUp,
    declaration: v.declaration,
    trick: v.trick,
    turn: v.turn,
    tricks: v.tricks,
    result: v.result,
  }
}

/** Seeger-Fabian for each seat of a finished deal: the declarer scores the game value + 50 when won,
 *  −2 × value − 50 when lost, and then each defender scores 40. A deal nobody played scores 0. */
export function seegerFabian(g: Pick<Game, 'phase' | 'declarer' | 'result'>): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0]
  if (g.phase !== 'done' || g.declarer === null || !g.result) return out
  const { won, value } = g.result
  out[g.declarer] = won ? value + 50 : -2 * value - 50
  if (!won) for (const s of [0, 1, 2] as Seat[]) if (s !== g.declarer) out[s] = 40
  return out
}

/** What a finished deal leaves in the day's record: enough to list it and to total every seat. */
export type DealSummary = {
  declarer: Seat | null
  declaration: Declaration | null
  bid: number
  won: boolean | null
  /** Seeger-Fabian per seat; [0] is the player's. */
  scores: [number, number, number]
}

export function summarize(g: Game): DealSummary {
  return {
    declarer: g.declarer,
    declaration: g.declaration,
    bid: g.bid,
    won: g.result ? g.result.won : null,
    scores: seegerFabian(g),
  }
}

/** Running Seeger-Fabian totals per seat over a day's finished deals. */
export function totals(deals: DealSummary[]): [number, number, number] {
  return deals.reduce<[number, number, number]>((t, d) => [t[0] + d.scores[0], t[1] + d.scores[1], t[2] + d.scores[2]], [0, 0, 0])
}

/** Where a player stands in a day. */
export type DailyStatus = {
  /** The tournament day, YYYY-MM-DD in Berlin. */
  day: string
  of: number
  /** The deal being played (0-based); equals `deals.length` until the day is finished. */
  deal: number
  deals: DealSummary[]
  totals: [number, number, number]
  started: boolean
  finished: boolean
}

/** What the server answers: where the player stands, the current deal as they see it (when it was
 *  asked to open it), and after a move every state the table passed through, in order. */
export type DailyReply = {
  status: DailyStatus
  view?: SeatView | null
  steps?: SeatView[]
  /** Moves the player has made in the current deal; a move must quote it. */
  revision: number
}
