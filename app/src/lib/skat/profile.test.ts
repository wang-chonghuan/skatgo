import { describe, expect, it } from 'vitest'

import { type Played, type ProfileDeal, recordOf, versusAi } from './profile'

const game = (scores: [number, number, number], declarer: 0 | 1 | 2 | null, won: boolean | null): Played => ({ scores, declarer, won })
const deal = (day: string, mine: Played, ai: Played | null): ProfileDeal => ({ day, source: 'daily', mine, ai })

const wonAsDeclarer = game([100, 0, 0], 0, true)
const lostAsDeclarer = game([-146, 40, 40], 0, false)
const wonAsDefender = game([40, -146, 40], 1, false)
const lostAsDefender = game([0, 72, 0], 1, true)
const passed = game([0, 0, 0], null, null)

// SKATGO-169: a side wins as declarer by winning the game and as defender when the declarer loses; all passed is no game.
describe('a side’s record', () => {
  it('counts the wins by role, leaves all passed out of the games and in the average', () => {
    expect(recordOf([wonAsDeclarer, lostAsDeclarer, wonAsDefender, lostAsDefender, passed])).toEqual({
      played: 4, won: 2, declared: 2, declaredWon: 1, defended: 2, defendedWon: 1, perDeal: (100 - 146 + 40) / 5,
    })
  })
  it('of no games is all zero', () => {
    expect(recordOf([])).toEqual({ played: 0, won: 0, declared: 0, declaredWon: 0, defended: 0, defendedWon: 0, perDeal: 0 })
  })
})

describe('the player against the AI', () => {
  it('counts only the deals the AI played, in both columns', () => {
    const v = versusAi([deal('2026-10-01', wonAsDeclarer, wonAsDefender), deal('2026-10-02', lostAsDeclarer, null)])
    expect(v?.you.played).toBe(1)
    expect(v?.you.declaredWon).toBe(1)
    expect(v?.ai.defendedWon).toBe(1)
  })
  it('is nothing when the AI played none', () => {
    expect(versusAi([deal('2026-10-02', lostAsDeclarer, null)])).toBeNull()
  })
})
