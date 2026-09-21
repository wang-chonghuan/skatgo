// One deal of Skat as a pure state machine: deal → bidding → skat → declaration → ten tricks →
// settlement. Every transition returns a new state, so the table component only renders and
// dispatches, and a test can play a whole game without a browser.
//
// Seats run clockwise: 0 is the learner, 1 sits to their left, 2 to their right. Play passes
// 0 → 1 → 2 → 0.

import {
  type Card,
  type Contract,
  fullDeck,
  legalPlays,
  pointsOf,
  sameCard,
  shuffle,
  trickWinnerIndex,
} from './cards'
import { type Advice, advise, chooseDeclaration, maxBid } from './ai'
import { type Declaration, type Settlement, nextBid, settle } from './value'

export type Seat = 0 | 1 | 2
export const next = (s: Seat): Seat => ((s + 1) % 3) as Seat

export type Role = 'forehand' | 'middlehand' | 'rearhand'
export const ROLE_NAME: Record<Role, string> = { forehand: '前家', middlehand: '中家', rearhand: '后家' }

export type BidEvent = { seat: Seat; say: 'bid' | 'hold' | 'pass'; value: number }

export type Bidding = {
  /** The one naming numbers. */
  speaker: Seat
  /** The one answering yes or pass. */
  listener: Seat
  /** Highest number said so far; 0 before anyone has spoken. */
  value: number
  /** Who must act: the speaker names the next number, or the listener answers the one on the table. */
  awaiting: 'speaker' | 'listener' | 'forehandAlone'
  stage: 1 | 2
  log: BidEvent[]
}

export type Phase = 'bidding' | 'skat' | 'declare' | 'play' | 'trickEnd' | 'done' | 'passedIn'

export type Played = { seat: Seat; card: Card }

export type Game = {
  dealer: Seat
  hands: [Card[], Card[], Card[]]
  originalHands: [Card[], Card[], Card[]]
  /** The two cards lying face down: the dealt skat, then the declarer's discards. */
  skat: Card[]
  originalSkat: Card[]
  phase: Phase
  bidding: Bidding
  declarer: Seat | null
  bid: number
  pickedUp: boolean
  declaration: Declaration | null
  trick: Played[]
  turn: Seat
  tricks: { winner: Seat; cards: Played[] }[]
  result: (Settlement & { declarerPoints: number; defenderPoints: number }) | null
}

export const forehandOf = (dealer: Seat): Seat => next(dealer)
export const middlehandOf = (dealer: Seat): Seat => next(next(dealer))

export function roleOf(seat: Seat, dealer: Seat): Role {
  if (seat === forehandOf(dealer)) return 'forehand'
  if (seat === middlehandOf(dealer)) return 'middlehand'
  return 'rearhand'
}

/** Deal 10–10–10 and two to the skat. `deck` lets a lesson or a test stack the cards. */
export function deal(dealer: Seat, deck: Card[] = shuffle(fullDeck())): Game {
  const fore = forehandOf(dealer)
  const hands: [Card[], Card[], Card[]] = [[], [], []]
  hands[fore] = deck.slice(0, 10)
  hands[next(fore)] = deck.slice(10, 20)
  hands[next(next(fore))] = deck.slice(20, 30)
  const skat = deck.slice(30, 32)
  return {
    dealer,
    hands,
    originalHands: [[...hands[0]], [...hands[1]], [...hands[2]]],
    skat,
    originalSkat: [...skat],
    phase: 'bidding',
    // Middlehand bids to forehand first; the dealer waits for the survivor.
    bidding: { speaker: middlehandOf(dealer), listener: fore, value: 0, awaiting: 'speaker', stage: 1, log: [] },
    declarer: null,
    bid: 0,
    pickedUp: false,
    declaration: null,
    trick: [],
    turn: fore,
    tricks: [],
    result: null,
  }
}

/** Whose move it is, in any phase that waits for someone. */
export function actor(g: Game): Seat | null {
  if (g.phase === 'bidding') {
    return g.bidding.awaiting === 'speaker' ? g.bidding.speaker : g.bidding.listener
  }
  if (g.phase === 'skat' || g.phase === 'declare') return g.declarer
  if (g.phase === 'play') return g.turn
  return null
}

function wonAuction(g: Game, winner: Seat): Game {
  const b = g.bidding
  if (b.stage === 1) {
    // The survivor of the first duel now listens to the dealer.
    return { ...g, bidding: { ...b, stage: 2, speaker: g.dealer, listener: winner, awaiting: 'speaker' } }
  }
  if (b.value === 0) {
    // Nobody has said a number. Forehand is the only one left and may still take the game at 18.
    return { ...g, bidding: { ...b, listener: winner, awaiting: 'forehandAlone' } }
  }
  return { ...g, phase: 'skat', declarer: winner, bid: b.value }
}

export type BidAction = 'bid' | 'hold' | 'pass'

export function bidAction(g: Game, action: BidAction): Game {
  const b = g.bidding
  if (g.phase !== 'bidding') return g

  if (b.awaiting === 'forehandAlone') {
    const seat = b.listener
    if (action === 'pass') {
      return { ...g, phase: 'passedIn', bidding: { ...b, log: [...b.log, { seat, say: 'pass', value: 0 }] } }
    }
    return { ...g, phase: 'skat', declarer: seat, bid: 18, bidding: { ...b, value: 18, log: [...b.log, { seat, say: 'bid', value: 18 }] } }
  }

  if (b.awaiting === 'speaker') {
    if (action === 'pass') {
      const log = [...b.log, { seat: b.speaker, say: 'pass' as const, value: 0 }]
      return wonAuction({ ...g, bidding: { ...b, log } }, b.listener)
    }
    const value = nextBid(b.value)
    if (value === null) return g
    return { ...g, bidding: { ...b, value, awaiting: 'listener', log: [...b.log, { seat: b.speaker, say: 'bid', value }] } }
  }

  if (action === 'pass') {
    const log = [...b.log, { seat: b.listener, say: 'pass' as const, value: 0 }]
    return wonAuction({ ...g, bidding: { ...b, log } }, b.speaker)
  }
  return { ...g, bidding: { ...b, awaiting: 'speaker', log: [...b.log, { seat: b.listener, say: 'hold', value: b.value }] } }
}

/** What a computer player does when it is its turn to speak. */
export function aiBid(g: Game): BidAction {
  const b = g.bidding
  const seat = actor(g)!
  const limit = maxBid(g.hands[seat])
  if (b.awaiting === 'forehandAlone') return limit >= 18 ? 'bid' : 'pass'
  if (b.awaiting === 'speaker') {
    const value = nextBid(b.value)
    return value !== null && value <= limit ? 'bid' : 'pass'
  }
  return b.value <= limit ? 'hold' : 'pass'
}

export function pickUpSkat(g: Game): Game {
  if (g.phase !== 'skat' || g.declarer === null) return g
  const hands = [...g.hands] as Game['hands']
  hands[g.declarer] = [...hands[g.declarer], ...g.skat]
  return { ...g, hands, skat: [], pickedUp: true }
}

/** Put two cards away and move on to the declaration. */
export function discard(g: Game, two: Card[]): Game {
  if (g.phase !== 'skat' || g.declarer === null || !g.pickedUp || two.length !== 2) return g
  const hands = [...g.hands] as Game['hands']
  hands[g.declarer] = hands[g.declarer].filter((c) => !two.some((d) => sameCard(c, d)))
  if (hands[g.declarer].length !== 10) return g
  return { ...g, hands, skat: two, phase: 'declare' }
}

/** Play from the hand as dealt, leaving the skat unseen. */
export function playHand(g: Game): Game {
  if (g.phase !== 'skat' || g.pickedUp) return g
  return { ...g, phase: 'declare' }
}

/** Announcements imply each other upwards, and none is legal once the skat has been looked at. */
export function normalise(d: Declaration, pickedUp: boolean): Declaration {
  if (d.contract.kind === 'null') {
    return { ...d, hand: !pickedUp, schneiderAnnounced: false, schwarzAnnounced: false }
  }
  if (pickedUp) return { ...d, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false }
  const schwarz = d.schwarzAnnounced || d.ouvert
  return { ...d, hand: true, schwarzAnnounced: schwarz, schneiderAnnounced: d.schneiderAnnounced || schwarz }
}

export function declare(g: Game, d: Declaration): Game {
  if (g.phase !== 'declare' || g.declarer === null) return g
  return { ...g, declaration: normalise(d, g.pickedUp), phase: 'play', turn: forehandOf(g.dealer), trick: [] }
}

/** The whole skat step for a computer declarer, in one move. */
export function aiDeclare(g: Game): Game {
  if (g.declarer === null) return g
  const picked = pickUpSkat(g)
  const { discard: two, declaration } = chooseDeclaration(picked.hands[g.declarer], g.bid)
  return declare(discard(picked, two), declaration)
}

export function legalFor(g: Game, seat: Seat): Card[] {
  if (g.phase !== 'play' || g.turn !== seat || !g.declaration) return []
  return legalPlays(g.hands[seat], g.trick.map((p) => p.card), g.declaration.contract)
}

export function playCard(g: Game, card: Card): Game {
  if (g.phase !== 'play' || !g.declaration) return g
  const seat = g.turn
  if (!legalFor(g, seat).some((c) => sameCard(c, card))) return g
  const hands = [...g.hands] as Game['hands']
  hands[seat] = hands[seat].filter((c) => !sameCard(c, card))
  const trick = [...g.trick, { seat, card }]
  // The third card leaves the trick on the table for a beat, so the learner can see who took it.
  if (trick.length === 3) return { ...g, hands, trick, phase: 'trickEnd' }
  return { ...g, hands, trick, turn: next(seat) }
}

export function trickWinner(g: Game): Seat | null {
  if (g.trick.length !== 3 || !g.declaration) return null
  return g.trick[trickWinnerIndex(g.trick.map((p) => p.card), g.declaration.contract)].seat
}

export function collectTrick(g: Game): Game {
  const winner = trickWinner(g)
  if (g.phase !== 'trickEnd' || winner === null || !g.declaration || g.declarer === null) return g
  const tricks = [...g.tricks, { winner, cards: g.trick }]
  const after: Game = { ...g, tricks, trick: [], turn: winner, phase: 'play' }
  // A Null is decided the moment the declarer takes a trick; nobody plays the rest out.
  const nullLost = g.declaration.contract.kind === 'null' && winner === g.declarer
  if (tricks.length < 10 && !nullLost) return after
  return finish(after)
}

function finish(g: Game): Game {
  const declarer = g.declarer!
  const mine = g.tricks.filter((t) => t.winner === declarer)
  const theirs = g.tricks.filter((t) => t.winner !== declarer)
  // The skat always counts for the declarer — discards and an unseen Hand skat alike.
  const declarerPoints = pointsOf(mine.flatMap((t) => t.cards.map((p) => p.card))) + pointsOf(g.skat)
  const defenderPoints = pointsOf(theirs.flatMap((t) => t.cards.map((p) => p.card)))
  const settlement = settle(g.declaration!, g.bid, [...g.originalHands[declarer], ...g.originalSkat], {
    declarerPoints,
    defenderPoints,
    declarerTricks: mine.length,
    defenderTricks: theirs.length,
  })
  return { ...g, phase: 'done', result: { ...settlement, declarerPoints, defenderPoints } }
}

/** What the heuristics would play from this seat right now — the computer's move, or the learner's hint. */
export function adviceFor(g: Game, seat: Seat): Advice | null {
  if (g.phase !== 'play' || g.turn !== seat || !g.declaration || g.declarer === null) return null
  return advise({
    hand: g.hands[seat],
    trick: g.trick.map((p) => p.card),
    trickSeats: g.trick.map((p) => p.seat),
    contract: g.declaration.contract,
    me: seat,
    declarer: g.declarer,
    gone: g.tricks.flatMap((t) => t.cards.map((p) => p.card)),
    buried: seat === g.declarer && g.pickedUp ? g.skat : [],
  })
}

/** Points each side has banked so far, for the running tally beside the table. */
export function runningPoints(g: Game): { declarer: number; defenders: number } {
  if (g.declarer === null) return { declarer: 0, defenders: 0 }
  const sum = (mine: boolean) =>
    pointsOf(g.tricks.filter((t) => (t.winner === g.declarer) === mine).flatMap((t) => t.cards.map((p) => p.card)))
  return { declarer: sum(true), defenders: sum(false) }
}

export const contractOf = (g: Game): Contract | null => g.declaration?.contract ?? null
