import { describe, expect, it } from 'vitest'

import { cards } from '../tricks/exercises/cards-of'
import { BID_LADDER } from '../value'
import { type BiddingRecord, CONTRACTS, PRACTICE_FREE, PRACTICE_QUESTIONS, analysisOf, difficultyOf, mistakesOf, questionAt, questionId, routineMisses, routineOf, solutionOf, tenCardValues, validAttempt, valueOptions } from './practice'

// SKATGO-149: the bidding practice's question logic — what the ten cards are worth, the game behind the answer, the
// options offered.

const HAND = cards('SJ DJ D10 D9 D8 D7 SA S8 H9 C8') // ♠J ♦J and four Diamonds, no ♣J

describe('bidding practice', () => {
  it('values each game from the ten cards: with or without n, game n + 1, times the base', () => {
    const v = tenCardValues(HAND)
    const diamonds = v.find((g) => g.contract.kind === 'suit' && g.contract.trump === 'D')!
    expect(diamonds).toMatchObject({ with: false, count: 1, base: 9, value: 18, trumps: 6 })
    const grand = v.find((g) => g.contract.kind === 'grand')!
    expect(grand).toMatchObject({ with: false, count: 1, value: 48, trumps: 2 })
  })

  it('answers by the routine: the longest suit with 6 trumps, 5 and an Ace, or 2 Buben and 2 Aces, at its count', () => {
    expect(routineOf(HAND)).toEqual({ contract: 'D', value: 18 })
    expect(routineOf(cards('SJ S10 S9 S8 SK HA H7 D8 D9 C7'))).toEqual({ contract: 'S', value: 22 })
    expect(routineOf(cards('SJ S10 S9 S8 SK H8 H7 D8 D9 C7'))).toEqual({ contract: 'pass', value: null })
    expect(routineOf(cards('CJ HJ CA SA H8 H7 D8 D9 C7 S7'))).toEqual({ contract: 'C', value: 24 })
  })

  it('names the AI\'s contract and offers its bid among three numbers anyone may bid; a Null among the four Null values', () => {
    for (const q of PRACTICE_QUESTIONS) {
      const sol = solutionOf(q)
      expect(CONTRACTS).toContain(sol.contract)
      if (sol.value === null) {
        expect(sol.contract).toBe('pass')
        expect(valueOptions(q)).toEqual([])
        continue
      }
      const v = valueOptions(q)
      expect(v).toContain(sol.value)
      if (sol.contract === 'N') expect(v).toEqual([23, 35, 46, 59])
      else {
        expect(v).toHaveLength(3)
        expect(v).toEqual([...v].sort((x, y) => x - y))
        expect(v.every((x) => BID_LADDER.includes(x))).toBe(true)
        expect(q.odds).toHaveLength(3)
      }
    }
    expect(PRACTICE_QUESTIONS.some((q) => solutionOf(q).contract === 'N')).toBe(true)
    expect(PRACTICE_QUESTIONS.some((q) => solutionOf(q).contract === 'G')).toBe(true)
  })

  // SKATGO-159 (the human: 「不用600个，可以减少，但是要稍微难一点……套路应该有，但是是基础的，低难度的」).
  it('is short: the routine answers at most a quarter, all first; every other question it gets wrong in a step', () => {
    expect(PRACTICE_QUESTIONS.length).toBeLessThan(200)
    const misses = PRACTICE_QUESTIONS.map(routineMisses).map((m) => m.contract || m.value)
    const basic = misses.indexOf(true)
    expect(basic).toBeGreaterThan(0)
    expect(basic).toBeLessThanOrEqual(PRACTICE_QUESTIONS.length / 4)
    expect(misses.slice(basic).every(Boolean)).toBe(true)
    const steps = PRACTICE_QUESTIONS.map(difficultyOf)
    expect(steps).toEqual([...steps].sort((a, b) => a - b))
  })

  it('asks how far: bids below the ten cards\' value, backed by SkatZero\'s chance at each number', () => {
    const counted = (q: (typeof PRACTICE_QUESTIONS)[number]) => {
      const a = solutionOf(q).answer
      return a.kind === 'game' ? a.game.value : q.bid
    }
    const far = PRACTICE_QUESTIONS.filter((q) => counted(q) !== q.bid)
    expect(far.length).toBeGreaterThanOrEqual(20)
    expect(far.every((q) => q.bid < counted(q))).toBe(true)
    // The stop is where SkatZero's chance falls at the very next bid — or a borderline game said at 18.
    for (const q of far) {
      const at = q.odds![valueOptions(q).indexOf(q.bid)]
      if (!q.above) {
        expect(q.bid).toBe(18)
        expect(at).toBeLessThanOrEqual(68)
        continue
      }
      expect(at).toBeGreaterThanOrEqual(55)
      expect(q.above[0]).toBe(BID_LADDER.find((b) => b > q.bid))
      expect(q.above[1]).toBeLessThanOrEqual(at - 12)
    }
  })

  it('runs in one order and starts again after the last; two questions are free', () => {
    expect(questionAt(1)).toBe(PRACTICE_QUESTIONS[0])
    expect(questionAt(PRACTICE_QUESTIONS.length + 1)).toBe(PRACTICE_QUESTIONS[0])
    expect(PRACTICE_FREE).toBe(2)
  })

  it('accepts an attempt only with step 2 exactly when the AI plays', () => {
    const plays = PRACTICE_QUESTIONS.find((q) => solutionOf(q).value !== null)!
    const passes = PRACTICE_QUESTIONS.find((q) => solutionOf(q).value === null)!
    expect(validAttempt(plays, { contract: 'pass', value: valueOptions(plays)[0] })).toBe(true)
    expect(validAttempt(plays, { contract: 'pass', value: null })).toBe(false)
    expect(validAttempt(plays, { contract: 'C', value: 1 })).toBe(false)
    expect(validAttempt(passes, { contract: 'G', value: null })).toBe(true)
    expect(validAttempt(passes, { contract: 'pass', value: 18 })).toBe(false)
  })

  it('sorts first attempts into right, passed, played, wrong game and wrong bid; lists the mistakes not put right', () => {
    const plays = PRACTICE_QUESTIONS.filter((q) => solutionOf(q).value !== null && solutionOf(q).contract !== 'N')
    const passes = PRACTICE_QUESTIONS.filter((q) => solutionOf(q).value === null)
    const [p1, p2, p3, p4] = plays
    const s = (q: (typeof PRACTICE_QUESTIONS)[number]) => solutionOf(q)
    const otherSuit = (c: string) => (c === 'C' ? 'S' : 'C') as 'C' | 'S'
    const record: BiddingRecord = {
      [questionId(p1)]: { contract: s(p1).contract, value: s(p1).value, fixed: false }, // right
      [questionId(p2)]: { contract: 'pass', value: s(p2).value, fixed: false }, // passed where it plays
      [questionId(passes[0])]: { contract: 'G', value: null, fixed: true }, // played where it passes, put right since
      [questionId(p3)]: { contract: otherSuit(s(p3).contract), value: s(p3).value, fixed: false }, // wrong game
      [questionId(p4)]: { contract: s(p4).contract, value: valueOptions(p4).find((v) => v !== s(p4).value)!, fixed: false }, // wrong bid
    }
    expect(analysisOf(record)).toEqual({ answered: 5, right: 1, passed: 1, played: 1, game: 1, value: 1 })
    const n = (q: (typeof PRACTICE_QUESTIONS)[number]) => PRACTICE_QUESTIONS.indexOf(q) + 1
    expect(mistakesOf(record)).toEqual([n(p2), n(p3), n(p4)].sort((x, y) => x - y))
  })

  it('names every question anew, so no answer from before SKATGO-159 counts', () => {
    expect(PRACTICE_QUESTIONS.every((q) => questionId(q).startsWith('v2-'))).toBe(true)
  })
})
