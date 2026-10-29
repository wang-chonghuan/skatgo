import { type Card, type Contract, SUITS, isTrump } from '../cards'
import { NULL_VALUES, baseValue, matadors } from '../value'
import { cards } from '../tricks/exercises/cards-of'
import { PRACTICE } from './practice.data'

// The bidding practice (SKATGO-149, the human: 「做成一个叫牌练习的东西，只叫牌」): a hand of ten cards and a seat,
// and one question — how high do you bid, or do you pass. The answer is SkatZero's highest bid for those cards from
// that seat, stored with free play's pool (multiplayer/skatzero/free-pool.json.gz) and copied out by
// multiplayer/scripts/make-bidding-practice.ts; multiplayer/test/bidding-practice.test.ts holds every question to the
// pool again. Only hands whose answer one game explains are questions: a pass, a Null, or exactly one suit game's
// or Grand's value counted from the ten cards — so the explanation is that game's calculation, never SkatZero's own
// numbers.

/** A question as stored: the pool's deal and seat (for the proof), the ten cards, the seat's position at the
 *  bidding (0 forehand, 1 middlehand, 2 rearhand) and SkatZero's highest bid, 0 for a pass. */
export type Practice = { deal: number; seat: number; hand: string; position: 0 | 1 | 2; bid: number }

/** What a suit game or Grand is worth from these ten cards: with or without n, game n + 1, times the base. */
export type Valued = { contract: Contract; with: boolean; count: number; base: number; value: number; trumps: number }

/** The bid that names a Null, and which. */
export const NULL_BIDS: Record<number, keyof typeof NULL_VALUES> = { 23: 'plain', 35: 'hand', 46: 'ouvert', 59: 'handOuvert' }

export type Answer = { kind: 'pass' } | { kind: 'game'; game: Valued } | { kind: 'null'; value: number; which: keyof typeof NULL_VALUES }

const GAMES: Contract[] = [...SUITS.map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }]

/** Every suit game and Grand, valued from the ten cards as a bidder counts before the skat. */
export function tenCardValues(hand: Card[]): Valued[] {
  return GAMES.map((contract) => {
    const m = matadors(hand, contract)
    const base = baseValue(contract)
    return { contract, with: m.with, count: m.count, base, value: base * (m.count + 1), trumps: hand.filter((c) => isTrump(c, contract)).length }
  })
}

/** The game behind a highest bid, or null when no single game explains it (then it is not a question). */
export function answerOf(hand: Card[], bid: number): Answer | null {
  if (bid < 18) return { kind: 'pass' }
  if (NULL_BIDS[bid]) return { kind: 'null', value: bid, which: NULL_BIDS[bid] }
  const games = tenCardValues(hand).filter((v) => v.value === bid)
  return games.length === 1 ? { kind: 'game', game: games[0] } : null
}

/** The four answers offered: pass, the right number, and what the hand's most tempting other games are worth — the
 *  ones with most trumps — so picking a number is picking the game and knowing its value. 0 is the pass. */
export function optionsOf(hand: Card[], bid: number): number[] {
  const right = bid < 18 ? 0 : bid
  const tempting = tenCardValues(hand)
    .filter((v) => v.contract.kind === 'suit' || v.trumps >= 2)
    .sort((a, b) => b.trumps - a.trumps || b.value - a.value)
    .map((v) => v.value)
  const out = new Set<number>([0, right])
  for (const v of tempting) if (out.size < 4) out.add(v)
  return [...out].sort((a, b) => a - b)
}

/** The game an offered number stands for — a number may stand for two games (36: Clubs × 3, Diamonds × 4); the one
 *  with more trumps is meant. */
export function gameOf(hand: Card[], value: number): Valued | null {
  const games = tenCardValues(hand).filter((v) => v.value === value)
  return games.sort((a, b) => b.trumps - a.trumps)[0] ?? null
}

export const practiceHand = (p: Practice): Card[] => cards(p.hand)

/** The questions in order; after the last, the first again. */
export const PRACTICE_QUESTIONS: Practice[] = PRACTICE
export const questionAt = (n: number): Practice => PRACTICE[(n - 1) % PRACTICE.length]

/** Questions a guest may answer; from the next one on, an account (the human: 「不登录可以练2题」). */
export const PRACTICE_FREE = 2
