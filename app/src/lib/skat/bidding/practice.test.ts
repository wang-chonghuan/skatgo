import { describe, expect, it } from 'vitest'

import { cards } from '../tricks/exercises/cards-of'
import { PRACTICE_FREE, PRACTICE_QUESTIONS, answerOf, gameOf, optionsOf, practiceHand, questionAt, tenCardValues } from './practice'

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
})
