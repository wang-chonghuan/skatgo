import { describe, expect, it } from 'vitest'

import { daysToReset, weekStart, xpOf, xpTier } from './xp'

// Experience points (SKATGO-172): a deal's tier by its difference to the AI's score, a week from Monday.

describe('a deal’s XP', () => {
  it('every deal earns XP, more the better it went against the AI', () => {
    expect([-120, -50, -49, -1, 0, 1, 49, 50, 200].map((d) => xpOf(d))).toEqual([4, 4, 6, 6, 10, 14, 14, 20, 20])
  })
  it('a deal without the AI’s result counts as the same', () => {
    expect(xpTier(null)).toBe('same')
    expect(xpOf(null)).toBe(10)
  })
  it('a game the player declared earns 2 more, won or lost', () => {
    expect([xpOf(0, true), xpOf(-120, true), xpOf(60, true)]).toEqual([12, 6, 22])
    expect(xpOf(0, false)).toBe(10)
  })
  it('a week is the sum of its deals', () => {
    expect([23, 0, -60, 75].map((d) => xpOf(d)).reduce((a, b) => a + b)).toBe(14 + 10 + 4 + 20)
  })
})

describe('the week', () => {
  it('a week starts on Monday', () => {
    expect(weekStart('2026-11-05')).toBe('2026-11-02')
    expect(weekStart('2026-11-02')).toBe('2026-11-02')
    expect(weekStart('2026-11-08')).toBe('2026-11-02')
    expect(weekStart('2027-01-01')).toBe('2026-12-28')
  })
  it('it starts again in 7 days on a Monday, tomorrow on a Sunday', () => {
    expect(daysToReset('2026-11-02')).toBe(7)
    expect(daysToReset('2026-11-05')).toBe(4)
    expect(daysToReset('2026-11-08')).toBe(1)
  })
})
