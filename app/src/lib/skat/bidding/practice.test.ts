import { describe, expect, it } from 'vitest'

import { cards } from '../tricks/exercises/cards-of'
import { type BiddingRecord, CONTRACTS, PRACTICE_FREE, PRACTICE_QUESTIONS, analysisOf, answerOf, difficultyOf, gameOf, mistakesOf, practiceHand, questionAt, questionId, readAnswered, solutionOf, tenCardValues, validAttempt, valueOptions } from './practice'

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

  it('names the game behind an answer, a pass below 18, a Null by its value, nothing when two games share it', () => {
    expect(answerOf(HAND, 0)).toEqual({ kind: 'pass' })
    expect(answerOf(HAND, 17)).toEqual({ kind: 'pass' })
    expect(answerOf(HAND, 23)).toEqual({ kind: 'null', value: 23, which: 'plain' })
    const a = answerOf(HAND, 18)
    expect(a?.kind === 'game' && a.game.contract).toEqual({ kind: 'suit', trump: 'D' })
    // ♥ without 1 is 20; nothing here is worth 21 or 27 alone.
    expect(answerOf(HAND, 27)).toBeNull()
    // Clubs with 4 and Hearts with 5 are both 60.
    expect(answerOf(cards('CJ SJ HJ DJ HA S7 S8 S9 D7 D8'), 60)).toBeNull()
  })

  it('names the AI\'s contract and offers its bid among neighbours; a Null among the four Null values', () => {
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
        const base = v[1] - v[0]
        expect(v[0]).toBeGreaterThanOrEqual(2 * base)
      }
    }
    expect(PRACTICE_QUESTIONS.some((q) => solutionOf(q).contract === 'N')).toBe(true)
    expect(gameOf(HAND, 18)?.contract).toEqual({ kind: 'suit', trump: 'D' })
  })

  it('runs from easy to hard; the first twenty are never in doubt', () => {
    const steps = PRACTICE_QUESTIONS.map(difficultyOf)
    expect(steps).toEqual([...steps].sort((a, b) => a - b))
    expect(steps.slice(0, 20).every((d) => d === 1)).toBe(true)
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

  it('reads a SKATGO-150 answer (one number) as the contract it stood for', () => {
    const plays = PRACTICE_QUESTIONS.find((q) => solutionOf(q).value !== null && solutionOf(q).contract !== 'N')!
    const sol = solutionOf(plays)
    expect(readAnswered(plays, { first: sol.value!, fixed: false })).toEqual({ contract: sol.contract, value: sol.value, fixed: false })
    expect(readAnswered(plays, { first: 0, fixed: true })).toEqual({ contract: 'pass', value: null, fixed: true })
  })
})
