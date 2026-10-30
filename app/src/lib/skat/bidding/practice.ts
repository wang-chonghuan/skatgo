import { type Card, type Contract, SUITS, isTrump } from '../cards'
import { NULL_VALUES, baseValue, matadors } from '../value'
import { cards } from '../tricks/exercises/cards-of'
import { PRACTICE } from './practice.data'

// The bidding practice (SKATGO-149, the human: 「做成一个叫牌练习的东西，只叫牌」): a hand of ten cards and a seat,
// and since SKATGO-151 two steps, as a learner thinks (the human: 「我想的是我能打什么合约」, 「答题分两步吧，先点什么合约，
// 再点最高叫到几点」): what do you play — a suit, Grand, Null, or pass — and then how high you can bid with it. The answer is
// SkatZero's highest bid for those cards from that seat and the game it plays there (SKATGO-154), stored with free play's
// pool (multiplayer/skatzero/free-pool.json.gz) and copied out by multiplayer/scripts/make-bidding-practice.ts;
// multiplayer/test/bidding-practice.test.ts holds every question to the pool again.
//
// Since SKATGO-159 (the human: 「叫牌练习感觉搞的太简单了……基本就是看有几个B，然后再看哪个花色多」, 「套路应该有，但是是基础的，
// 低难度的」) the run is short and mostly hard: a few hands the rules of thumb answer (`routineOf`) open it, then hands
// where they fail — a pass with Buben, a game without them, a game other than the longest suit, a bid below the ten
// cards' value (SkatZero bids past it only in a Hand game, which is not asked). Those are explained with SkatZero's own numbers (the human agreed to 「AI 在各价位的胜率」): the chance
// it makes its game at each bid offered.

/** A question as stored: the pool's deal and seat (for the proof), the ten cards, the seat's position at the bidding
 *  (0 forehand, 1 middlehand, 2 rearhand), SkatZero's highest bid (0 for a pass) and the contract it plays there. */
export type Practice = {
  deal: number
  seat: number
  hand: string
  position: 0 | 1 | 2
  bid: number
  contract: ContractKey
  /** For a bid, how often SkatZero plays the contract at that bid, over every skat (SKATGO-154): only a high share is
   *  asked, so the contract named is SkatZero's own. */
  sure?: number
  /** Step 2's numbers for a suit game or Grand, ascending (SKATGO-159): the bid and its neighbours. */
  options?: number[]
  /** The chance SkatZero makes the contract at each of `options`, in whole percent. */
  odds?: number[]
  /** For a bid below the ten cards' value, the very next bid and SkatZero's chance there: where it falls. None for a
   *  borderline game stopped at 18. */
  above?: [number, number]
  /** Each suit game's and Grand's chance to be made at the bid — at 18 for a pass — in whole percent: what the
   *  explanation says of a contract chosen instead, and of the routine's game when SkatZero passes. */
  games?: Partial<Record<GameKey, number>>
}

export type GameKey = 'C' | 'S' | 'H' | 'D' | 'G'

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

/** A suit game's or Grand's ten-card value by its key. */
export const valuedOf = (hand: Card[], key: GameKey): Valued =>
  tenCardValues(hand).find((v) => (key === 'G' ? v.contract.kind === 'grand' : v.contract.kind === 'suit' && v.contract.trump === key))!

export const practiceHand = (p: Practice): Card[] => cards(p.hand)

/** The questions in order; after the last, the first again. */
export const PRACTICE_QUESTIONS: Practice[] = PRACTICE
export const questionAt = (n: number): Practice => PRACTICE[(n - 1) % PRACTICE.length]

/** How often, at least, SkatZero must play the answer's game at its highest bid for a question to name it (SKATGO-154). */
export const SURE = 0.6

/** Questions a guest may answer; from the next one on, an account (the human: 「不登录可以练2题」). */
export const PRACTICE_FREE = 2

// Since SKATGO-151 the question has two steps: the contract, then (unless the AI passes) the highest bid for the AI's
// contract (the human: 「答题分两步吧，先点什么合约，再点最高叫到几点」, 「你还没说null呢」).

/** The contracts offered, always all of them, so the list gives nothing away. */
export const CONTRACTS = ['pass', 'C', 'S', 'H', 'D', 'G', 'N'] as const
export type ContractKey = (typeof CONTRACTS)[number]

/** The question's answer: the AI's contract, and its highest bid (null when it passes). */
export function solutionOf(p: Practice): { contract: ContractKey; value: number | null; answer: Answer } {
  if (p.contract === 'pass') return { contract: 'pass', value: null, answer: { kind: 'pass' } }
  if (p.contract === 'N') return { contract: 'N', value: p.bid, answer: { kind: 'null', value: p.bid, which: NULL_BIDS[p.bid] } }
  return { contract: p.contract, value: p.bid, answer: { kind: 'game', game: valuedOf(practiceHand(p), p.contract) } }
}

/** Step 2's numbers: for a suit game or Grand the stored ones, for a Null its four fixed values. */
export function valueOptions(p: Practice): number[] {
  if (p.contract === 'pass') return []
  if (p.contract === 'N') return Object.values(NULL_VALUES)
  return p.options ?? []
}

/** The suit with most trumps, as a learner first looks: its contract and how many trumps it holds. */
export function bestSuit(hand: Card[]): Valued {
  return tenCardValues(hand)
    .filter((v) => v.contract.kind === 'suit')
    .sort((a, b) => b.trumps - a.trumps || b.value - a.value)[0]
}

/** Aces outside a suit (all four for Grand or none given). */
export const sideAces = (hand: Card[], trump?: string) => hand.filter((c) => c.rank === 'A' && c.suit !== trump).length

/**
 * The routine (SKATGO-159, the human: 「基本就是看有几个B，然后再看哪个花色多」): what a learner answers by the rules of thumb
 * alone — the suit with most trumps, played with 6 trumps or more, 5 and a side Ace, or 2 Buben and 2 Aces, else a
 * pass — bid to its value counted from the ten cards. A question it answers right is a basic one.
 */
export function routineOf(hand: Card[]): { contract: ContractKey; value: number | null } {
  const best = bestSuit(hand)
  const trump = best.contract.kind === 'suit' ? best.contract.trump : undefined
  const jacks = hand.filter((c) => c.rank === 'J').length
  const play = best.trumps >= 6 || (best.trumps === 5 && sideAces(hand, trump) > 0) || (jacks >= 2 && sideAces(hand) >= 2)
  return play && trump ? { contract: trump, value: best.value } : { contract: 'pass', value: null }
}

/** Which steps the routine gets wrong: the contract, and — when both play the same game — the bid. */
export function routineMisses(p: Practice): { contract: boolean; value: boolean } {
  const r = routineOf(practiceHand(p))
  const sol = solutionOf(p)
  const contract = r.contract !== sol.contract
  return { contract, value: !contract && r.value !== sol.value }
}

/** How hard a question is, so the run goes from easy to hard (SKATGO-159): 1 — the routine answers it; 2 — it gets pass
 *  or play wrong, or the bid; 3 — both play, but SkatZero plays another game than the longest suit. */
export function difficultyOf(p: Practice): 1 | 2 | 3 {
  const miss = routineMisses(p)
  if (!miss.contract && !miss.value) return 1
  return miss.contract && p.contract !== 'pass' && routineOf(practiceHand(p)).contract !== 'pass' ? 3 : 2
}

// The record (SKATGO-150, the human: 「用户能记录下来他哪个题出错了吗」, then 「超叫还是不敢叫还是叫错等等的分析……最好有个
// 比率分析」): per question the first complete attempt — the contract and, when asked, the bid — and whether a later
// attempt got both right. Since SKATGO-159 the questions' names carry `v2-`, and every answer to the questions before is
// deleted (the human: 「用户已经答过的，可以删除记录，不要影响新版」).

/** A question's lasting name: its deal and seat in free play's pool, whatever order the questions run in. */
export const questionId = (p: Practice) => `v2-${p.deal}-${p.seat}`
const BY_ID = new Map(PRACTICE.map((p, i) => [questionId(p), i + 1]))
/** The question's number in the run, by its name; undefined for a name not among them. */
export const numberOf = (id: string): number | undefined => BY_ID.get(id)
export const practiceOf = (id: string): Practice | undefined => {
  const n = numberOf(id)
  return n ? PRACTICE[n - 1] : undefined
}
/** The free questions' names: a guest's answers are kept for these only. */
export const FREE_IDS = PRACTICE.slice(0, PRACTICE_FREE).map(questionId)

export type Attempt = { contract: ContractKey; value: number | null }
export type Answered = Attempt & { fixed: boolean }
export type BiddingRecord = Record<string, Answered>

/** Whether an attempt is complete and allowed: a contract offered, and a bid among step 2's exactly when it is asked. */
export function validAttempt(p: Practice, a: Attempt): boolean {
  if (!CONTRACTS.includes(a.contract)) return false
  const sol = solutionOf(p)
  return sol.value === null ? a.value === null : a.value !== null && valueOptions(p).includes(a.value)
}

/** Whether an attempt is right in both steps. */
export function rightAttempt(p: Practice, a: Attempt): boolean {
  const sol = solutionOf(p)
  return a.contract === sol.contract && a.value === sol.value
}

/**
 * The first attempts sorted by what went wrong (SKATGO-151; the human's 超叫, 不敢叫, 叫错, and the counting): a pass where
 * the AI plays, a game where it passes, the wrong game, or the right game with the wrong bid. The four never overlap and
 * make up every mistake.
 */
export type Analysis = { answered: number; right: number; passed: number; played: number; game: number; value: number }

export function analysisOf(record: BiddingRecord): Analysis {
  const a: Analysis = { answered: 0, right: 0, passed: 0, played: 0, game: 0, value: 0 }
  for (const [id, r] of Object.entries(record)) {
    const p = practiceOf(id)
    if (!p) continue
    const sol = solutionOf(p)
    a.answered++
    if (rightAttempt(p, r)) a.right++
    else if (r.contract === 'pass') a.passed++
    else if (sol.contract === 'pass') a.played++
    else if (r.contract !== sol.contract) a.game++
    else a.value++
  }
  return a
}

/** The questions answered wrong at first and not yet right since, by number. */
export function mistakesOf(record: BiddingRecord): number[] {
  return Object.entries(record)
    .filter(([id, r]) => {
      const p = practiceOf(id)
      return p && !r.fixed && !rightAttempt(p, r)
    })
    .map(([id]) => numberOf(id)!)
    .sort((x, y) => x - y)
}
