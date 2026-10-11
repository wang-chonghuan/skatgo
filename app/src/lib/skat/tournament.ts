// The daily tournament's rules on top of the engine (SKATGO-35): what one player is allowed to see of a
// deal the server owns, how that view becomes a table the course's GameTable can draw, and how a deal is
// scored. Pure, like the rest of lib/skat: the multiplayer service, which owns the cards, and the
// browser, which draws them, read the same definitions.

import type { Card } from './cards'
import type { Bidding, Game, Phase, Played, Seat } from './game'
import type { Declaration } from './value'

/** The day's tournaments, by their number of deals (SKATGO-77): a short round of six (SKATGO-62: a
 *  day is a short round, not an evening) and a longer one of twelve. Each has its own deals and board. */
export const DAILY_SIZES = [6, 12] as const
export type DailySize = (typeof DAILY_SIZES)[number]

/** How many days back a leaderboard can be looked at, today included (SKATGO-80, the human: 「要保留显示最近7天
 *  的」). */
export const BOARD_DAYS = 7

/** The tournament a player is shown first, and the one every entry before SKATGO-77 belongs to. */
export const DAILY_DEALS: DailySize = 6

/** A requested tournament size, or the first one when it names none of them. */
export const dailySize = (n: unknown): DailySize => (DAILY_SIZES as readonly unknown[]).includes(n) ? (n as DailySize) : DAILY_DEALS

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
  /** How a deal decided before its last card ended (SKATGO-59). */
  early: Game['early'] | null
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
    early: g.early ?? null,
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
    early: v.early ?? undefined,
  }
}

/** Seeger-Fabian's bonuses at a three-player table: the declarer's +50 for a won game and −50 for a
 *  lost one, and each defender's 40 when the declarer loses. The score sheet prints them (SKATGO-53). */
export const SEEGER_FABIAN = { won: 50, lost: 50, defender: 40 } as const

/** Seeger-Fabian for each seat of a finished deal: the declarer scores the game value + 50 when won,
 *  −2 × value − 50 when lost, and then each defender scores 40. A deal nobody played scores 0. */
export function seegerFabian(g: Pick<Game, 'phase' | 'declarer' | 'result'>): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0]
  if (g.phase !== 'done' || g.declarer === null || !g.result) return out
  const { won, value } = g.result
  out[g.declarer] = won ? value + SEEGER_FABIAN.won : -2 * value - SEEGER_FABIAN.lost
  if (!won) for (const s of [0, 1, 2] as Seat[]) if (s !== g.declarer) out[s] = SEEGER_FABIAN.defender
  return out
}

/** How a played deal ended, beyond who won (SKATGO-48): what a comparison needs to say what happened
 *  even when a defender's score is 0 either way. */
export type DealDetail = {
  /** The game value it was scored at (after any overbid correction). */
  value: number
  declarerPoints: number
  defenderPoints: number
  overbid: boolean
  /** Reached, announced or not. */
  schneider: boolean
  schwarz: boolean
}

/** What a finished deal leaves in the day's record: enough to list it and to total every seat. */
export type DealSummary = {
  declarer: Seat | null
  declaration: Declaration | null
  bid: number
  won: boolean | null
  /** Seeger-Fabian per seat; [0] is the player's. */
  scores: [number, number, number]
  /** How a played deal ended (SKATGO-48); null for a deal nobody played. */
  detail: DealDetail | null
}

export function detailOf(g: Game): DealDetail | null {
  if (g.phase !== 'done' || !g.result) return null
  const r = g.result
  const kinds = new Set(r.parts.map((p) => p.kind))
  return {
    value: r.value,
    declarerPoints: r.declarerPoints,
    defenderPoints: r.defenderPoints,
    overbid: r.overbid,
    schneider: kinds.has('schneider'),
    schwarz: kinds.has('schwarz'),
  }
}

export function summarize(g: Game): DealSummary {
  return {
    declarer: g.declarer,
    declaration: g.declaration,
    bid: g.bid,
    won: g.result ? g.result.won : null,
    scores: seegerFabian(g),
    detail: detailOf(g),
  }
}

/** What one seat said in a deal's auction (SKATGO-57): the highest number it named or held — 0 when it
 *  passed before any — and whether it passed. The declarer is the seat that did not. */
export type SeatBid = { value: number; passed: boolean }
export type Auction = [SeatBid, SeatBid, SeatBid]

/** A deal's auction, from the engine's own record of it. */
export function auctionOf(g: Game): Auction {
  const out: Auction = [{ value: 0, passed: false }, { value: 0, passed: false }, { value: 0, passed: false }]
  for (const e of g.bidding.log) {
    if (e.say === 'pass') out[e.seat].passed = true
    else out[e.seat].value = Math.max(out[e.seat].value, e.value)
  }
  return out
}

/** Running Seeger-Fabian totals per seat over a day's finished deals. */
export function totals(deals: DealSummary[]): [number, number, number] {
  return deals.reduce<[number, number, number]>((t, d) => [t[0] + d.scores[0], t[1] + d.scores[1], t[2] + d.scores[2]], [0, 0, 0])
}

/** How far a seat is ahead of the other two (SKATGO-79, the human: 「能看出我比对手强多少」): its
 *  score less each other seat's, added — (own − one) + (own − other). 0 when all three are level; the
 *  three seats' Saldo add up to 0. Of one deal's scores, or of a tournament's totals. */
export function saldo(scores: readonly [number, number, number], seat: Seat = PLAYER): number {
  return 3 * scores[seat] - (scores[0] + scores[1] + scores[2])
}

/** A card the player played where SkatZero would have played another (SKATGO-79): at each of their plays
 *  SkatZero values every legal card, and this is one whose card fell below the best one. `trick` counts
 *  from 1; `loss` is how far below, in SkatZero's own values. */
export type Differ = { trick: number; played: Card; best: Card; loss: number }

/** What the review of one finished deal works from: the deal as the player played it, the AI's in the
 *  same seat, and where the player's cards were not the AI's. */
export type DealReview = {
  deal: number
  bid: number
  mine: DealSummary
  ai: DealSummary | null
  auction: Auction
  aiAuction: Auction | null
  /** Every play where the player's card was not SkatZero's, the furthest below its best first — the first is
   *  the move most worth improving (the human: no threshold, 「通过10墩排序的方式，选出最差的」); empty
   *  when every card was SkatZero's own choice. */
  differs: Differ[]
  /** The deal trick by trick as it was played — the tricks claimed or given up (`early`) left out — and
   *  the skat, for the replay the AI's cards are read against. */
  tricks: Game['tricks']
  skat: Card[]
  early: Game['early'] | null
  /** The player's ten cards when the play began, sorted for the game (SKATGO-79). */
  hand: Card[]
}

/** Where a player stands in a day. */
export type DailyStatus = {
  /** The tournament day, YYYY-MM-DD in Berlin. */
  day: string
  /** Which of the day's tournaments, by its number of deals (SKATGO-77). */
  of: DailySize
  /** The deal being played (0-based); equals `deals.length` until the day is finished. */
  deal: number
  deals: DealSummary[]
  totals: [number, number, number]
  started: boolean
  finished: boolean
  /** For each finished deal, the same deal played by the computer in the player's seat (SKATGO-42):
   *  its contract, declarer and Seeger-Fabian scores ([0] is the computer's). Null on days dealt
   *  before it. */
  benchmarks?: (DealSummary | null)[]
  /** Each finished deal's auction, the player's (`auctions`) and the AI's (`benchmarkAuctions`)
   *  (SKATGO-57). Not stored: the server replays each deal's recorded moves through the engine. */
  auctions?: Auction[]
  benchmarkAuctions?: (Auction | null)[]
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

/** One row of a day's leaderboard (SKATGO-36): a nickname, its Saldo — what ranks it since SKATGO-79 —
 *  and its own total, never who is behind it. */
export type BoardRow = { rank: number; nickname: string; total: number; me: boolean }

/** A day's leaderboard, and where the asking player stands on it. */
export type DailyBoard = {
  day: string
  /** The top of the board. */
  rows: BoardRow[]
  /** The asking player's row when it is below the top. */
  own: BoardRow | null
  /** Entries on the board in all, beyond the rows shown. */
  total: number
  /** The asking player's entry that day: a finished player without a nickname gets the rank they would have. */
  me: { finished: boolean; total: number; nickname: string | null; rank: number | null } | null
  /** The nickname the player last used, to offer again. */
  lastNickname: string | null
  /** The AI's Seeger-Fabian total over the tournament that day, from the player's seat, for everyone
   *  (SKATGO-80, SKATGO-81); null for a day it did not play. */
  ai: { total: number } | null
}
