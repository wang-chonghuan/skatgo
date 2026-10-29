import { type Card, type Contract, SUITS, isTrump } from '../cards'
import { NULL_VALUES, baseValue, matadors } from '../value'
import { cards } from '../tricks/exercises/cards-of'
import { PRACTICE } from './practice.data'

// The bidding practice (SKATGO-149, the human: 「做成一个叫牌练习的东西，只叫牌」): a hand of ten cards and a seat,
// and since SKATGO-151 two steps, as a learner thinks (the human: 「我想的是我能打什么合约」, 「答题分两步吧，先点什么合约，
// 再点最高叫到几点」): what do you play — a suit, Grand, Null, or pass — and then how high you can bid with it. The answer is SkatZero's highest bid for those cards from
// that seat, stored with free play's pool (multiplayer/skatzero/free-pool.json.gz) and copied out by
// multiplayer/scripts/make-bidding-practice.ts; multiplayer/test/bidding-practice.test.ts holds every question to the
// pool again. Only hands whose answer one game explains are questions: a pass, a Null, or exactly one suit game's
// or Grand's value counted from the ten cards — so the explanation is that game's calculation, never SkatZero's own
// numbers. Since SKATGO-154 that game must also be the one SkatZero itself plays at its highest bid (`sure`): a number
// alone may match a game SkatZero never meant (the human's 「第五题」, Spades named for a hand plainly Diamonds).

/** A question as stored: the pool's deal and seat (for the proof), the ten cards, the seat's position at the
 *  bidding (0 forehand, 1 middlehand, 2 rearhand) and SkatZero's highest bid, 0 for a pass. */
export type Practice = {
  deal: number
  seat: number
  hand: string
  position: 0 | 1 | 2
  bid: number
  /** For a bid, how often SkatZero plays the answer's game at that bid, over every skat (SKATGO-154): the generator keeps
   *  a question only when this is high, so the contract named is SkatZero's own. */
  sure?: number
}

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

/** How often, at least, SkatZero must play the answer's game at its highest bid for a question to name it (SKATGO-154). */
export const SURE = 0.6

/** Questions a guest may answer; from the next one on, an account (the human: 「不登录可以练2题」). */
export const PRACTICE_FREE = 2

// Since SKATGO-151 the question has two steps: the contract, then (unless the AI passes) the highest bid for the AI's
// contract (the human: 「答题分两步吧，先点什么合约，再点最高叫到几点」, 「你还没说null呢」).

/** The contracts offered, always all of them, so the list gives nothing away. */
export const CONTRACTS = ['pass', 'C', 'S', 'H', 'D', 'G', 'N'] as const
export type ContractKey = (typeof CONTRACTS)[number]

/** The contract an answer is. */
export const contractOf = (a: Answer): ContractKey =>
  a.kind === 'pass' ? 'pass' : a.kind === 'null' ? 'N' : a.game.contract.kind === 'grand' ? 'G' : a.game.contract.kind === 'suit' ? a.game.contract.trump : 'pass'

/** The question's answer: the AI's contract, and its highest bid (null when it passes). */
export function solutionOf(p: Practice): { contract: ContractKey; value: number | null; answer: Answer } {
  const answer = answerOf(practiceHand(p), p.bid)!
  return { contract: contractOf(answer), value: answer.kind === 'pass' ? null : p.bid, answer }
}

/**
 * Step 2's numbers: for a suit game or Grand the right multiplier and its neighbours — one less, as if "game" were
 * forgotten, and one more, as if a matador were miscounted — never under 2; for a Null its four fixed values.
 */
export function valueOptions(p: Practice): number[] {
  const { answer } = solutionOf(p)
  if (answer.kind === 'pass') return []
  if (answer.kind === 'null') return Object.values(NULL_VALUES)
  const level = answer.game.count + 1
  const from = Math.max(2, level - 1)
  return [from, from + 1, from + 2].map((k) => k * answer.game.base)
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
 * How plain a question is, so the run goes from easy to hard: 1 — 6 trumps or more, or 3 or fewer, where the answer is
 * never in doubt; 2 — the hands the rules of thumb decide (5 trumps with a side Ace, 4 without); 3 — the rest, and every
 * hand the AI plays as Grand or Null, which a beginner meets after the suit games.
 */
export function difficultyOf(p: Practice): 1 | 2 | 3 {
  const { contract } = solutionOf(p)
  if (contract === 'G' || contract === 'N') return 3
  const hand = practiceHand(p)
  const best = bestSuit(hand)
  if (best.trumps >= 6 || best.trumps <= 3) return 1
  const ace = sideAces(hand, best.contract.kind === 'suit' ? best.contract.trump : undefined) > 0
  if ((best.trumps === 5 && ace) || (best.trumps === 4 && !ace)) return 2
  return 3
}

// The record (SKATGO-150, the human: 「用户能记录下来他哪个题出错了吗」, then 「超叫还是不敢叫还是叫错等等的分析……最好有个
// 比率分析」): per question the first complete attempt — the contract and, when asked, the bid — and whether a later
// attempt got both right. SKATGO-150's answers were one number, `first`: read as the contract it stood for.

/** A question's lasting name: its deal and seat in free play's pool, whatever order the questions run in. */
export const questionId = (p: Practice) => `${p.deal}-${p.seat}`
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
/** A row as SKATGO-150 kept it. */
type Legacy = { first: number; fixed: boolean }
export type BiddingRecord = Record<string, Answered>

/** A stored row in today's shape: SKATGO-150's number read as the contract it stood for, its value kept only when that
 *  contract was the AI's (step 2 asks the AI's contract). */
export function readAnswered(p: Practice, r: Answered | Legacy): Answered {
  if ('contract' in r) return r
  const sol = solutionOf(p)
  if (r.first === 0) return { contract: 'pass', value: null, fixed: r.fixed }
  const g = gameOf(practiceHand(p), r.first)
  const contract: ContractKey = NULL_BIDS[r.first] ? 'N' : g ? contractOf({ kind: 'game', game: g }) : 'pass'
  return { contract, value: contract === sol.contract ? r.first : null, fixed: r.fixed }
}

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
