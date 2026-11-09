import { describe, expect, it } from 'vitest'

import { xpOf, xpTier } from './xp'

// Experience points (SKATGO-172): a deal's tier by its difference to the AI's score.

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
  it('a player’s XP is the sum of their deals', () => {
    expect([23, 0, -60, 75].map((d) => xpOf(d)).reduce((a, b) => a + b)).toBe(14 + 10 + 4 + 20)
  })
})
