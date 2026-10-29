import { describe, expect, it } from 'vitest'

import { cards } from '../tricks/exercises/cards-of'
import { type BiddingRecord, PRACTICE_FREE, PRACTICE_QUESTIONS, analysisOf, answerOf, gameOf, mistakesOf, optionsOf, practiceHand, questionAt, questionId, rightAnswer, tenCardValues } from './practice'

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

  it('offers pass, the answer and the most tempting other games, in order', () => {
    const o = optionsOf(HAND, 18)
    expect(o[0]).toBe(0)
    expect(o).toContain(18)
    expect(o).toHaveLength(4)
    expect([...o].sort((a, b) => a - b)).toEqual(o)
    expect(optionsOf(HAND, 0)[0]).toBe(0)
    expect(gameOf(HAND, 18)?.contract).toEqual({ kind: 'suit', trump: 'D' })
  })

  it('every stored question has a game behind its answer, the answer among four options', () => {
    for (const q of PRACTICE_QUESTIONS) {
      const hand = practiceHand(q)
      expect(hand).toHaveLength(10)
      expect(answerOf(hand, q.bid)).not.toBeNull()
      const o = optionsOf(hand, q.bid)
      expect(o).toContain(q.bid)
      expect(o.length).toBeGreaterThanOrEqual(3)
    }
    expect(PRACTICE_QUESTIONS.filter((q) => q.bid === 0).length).toBeGreaterThan(PRACTICE_QUESTIONS.length / 4)
  })

  it('runs in one order and starts again after the last; two questions are free', () => {
    expect(questionAt(1)).toBe(PRACTICE_QUESTIONS[0])
    expect(questionAt(PRACTICE_QUESTIONS.length + 1)).toBe(PRACTICE_QUESTIONS[0])
    expect(PRACTICE_FREE).toBe(2)
  })

  it('sorts first answers into right, overbid and underbid, each by its cause; lists the mistakes not put right', () => {
    const pass = PRACTICE_QUESTIONS.find((q) => q.bid === 0)!
    const bids = PRACTICE_QUESTIONS.filter((q) => q.bid > 0)
    // A bid question where both a higher and a lower game are offered.
    const both = bids.find((q) => {
      const o = optionsOf(practiceHand(q), q.bid)
      return o.some((v) => v > q.bid) && o.some((v) => v > 0 && v < q.bid)
    })!
    const other = bids.find((q) => q !== both)!
    const opts = optionsOf(practiceHand(both), both.bid)
    const record: BiddingRecord = {
      [questionId(pass)]: { first: optionsOf(practiceHand(pass), 0)[1], fixed: false }, // bid where it passes
      [questionId(both)]: { first: opts.find((v) => v > both.bid)!, fixed: true }, // a higher game, put right since
      [questionId(other)]: { first: 0, fixed: false }, // passed where it bids
      [questionId(bids[bids.length - 1])]: { first: rightAnswer(bids[bids.length - 1]), fixed: false },
    }
    expect(analysisOf(record)).toEqual({ answered: 4, right: 1, over: { pass: 1, game: 1 }, under: { pass: 1, game: 0 } })
    const n = (q: (typeof PRACTICE_QUESTIONS)[number]) => PRACTICE_QUESTIONS.indexOf(q) + 1
    expect(mistakesOf(record)).toEqual([n(pass), n(other)].sort((x, y) => x - y))
    // A lower game is underbid by game.
    expect(analysisOf({ [questionId(both)]: { first: opts.find((v) => v > 0 && v < both.bid)!, fixed: false } }).under).toEqual({ pass: 0, game: 1 })
  })
})
