import { describe, expect, it } from 'vitest'

import { AWAY_MS, BRONZE_FLOOR, DEAL_POINTS, FEES, LEGEND, PROMOTE_AT, RELEGATE_AT, TIERS, dealOutcome, leftOutcome, standingAfter } from './league'

// The League's numbers as SKATGO-205 sets them: six tiers and their fees per deal; per deal +3 when one's side won, −3 for
// one's own game lost, −1 for the declarer's game made against one, 0 when all passed; +30 up and −20 down from 0 again,
// no relegation from Bronze, no promotion from Legend. A deal not seen to its end (SKATGO-206) is lost: −3 declaring, else
// −1; away a minute counts as leaving.

describe('the League', () => {
  it('has six tiers, Bronze to Legend, and their fees per deal', () => {
    expect(TIERS).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'])
    expect(FEES).toEqual([3, 4, 5, 7, 8, 10])
    expect(DEAL_POINTS).toEqual({ won: 3, lost: -3, defended: -1, saved: 0, passed: 0, leftDeclaring: -3, left: -1 })
    expect(AWAY_MS).toBe(60_000)
    expect([PROMOTE_AT, RELEGATE_AT]).toEqual([30, -20])
  })

  it('scores a deal by how one’s own side came out of it', () => {
    expect(dealOutcome(1, true, 1)).toBe('won')
    expect(dealOutcome(1, false, 1)).toBe('lost')
    expect(dealOutcome(1, true, 0)).toBe('defended')
    expect(dealOutcome(1, false, 2)).toBe('won')
    expect(dealOutcome(null, false, 0)).toBe('passed')
  })

  it('keeps a lost defence at 0 when the defenders took 31 card points (SKATGO-210)', () => {
    expect(dealOutcome(1, true, 0, 30)).toBe('defended')
    expect(dealOutcome(1, true, 0, 31)).toBe('saved')
    expect(dealOutcome(1, true, 0, 59)).toBe('saved')
    // A Null game counts no card points: still −1.
    expect(dealOutcome(1, true, 0, null)).toBe('defended')
    // The declarer's own side and a beaten declarer are as before.
    expect(dealOutcome(1, true, 1, 40)).toBe('won')
    expect(dealOutcome(1, false, 0, 70)).toBe('won')
    expect([DEAL_POINTS.saved, DEAL_POINTS.defended]).toEqual([0, -1])
  })

  it('loses a deal left before its end by one’s part in it when going', () => {
    expect(leftOutcome(1, 1)).toBe('leftDeclaring')
    expect(leftOutcome(1, 0)).toBe('left')
    expect(leftOutcome(null, 2)).toBe('left')
  })

  it('adds a deal’s points', () => {
    expect(standingAfter({ tier: 2, points: 4 }, 3)).toEqual({ tier: 2, points: 7, moved: 0 })
    expect(standingAfter({ tier: 2, points: 4 }, -1)).toEqual({ tier: 2, points: 3, moved: 0 })
    expect(standingAfter({ tier: 2, points: 4 }, 0)).toEqual({ tier: 2, points: 4, moved: 0 })
  })

  it('moves up at +30 and down at −20, starting again from 0', () => {
    expect(standingAfter({ tier: 1, points: 27 }, 3)).toEqual({ tier: 2, points: 0, moved: 1 })
    expect(standingAfter({ tier: 3, points: -19 }, -1)).toEqual({ tier: 2, points: 0, moved: -1 })
    expect(standingAfter({ tier: 3, points: -17 }, -3)).toEqual({ tier: 2, points: 0, moved: -1 })
    expect(standingAfter({ tier: 3, points: 26 }, 3)).toEqual({ tier: 3, points: 29, moved: 0 })
  })

  it('never relegates from Bronze, never promotes from Legend', () => {
    // Bronze stops at 0 (SKATGO-207).
    expect(BRONZE_FLOOR).toBe(0)
    expect(standingAfter({ tier: 0, points: 2 }, -3)).toEqual({ tier: 0, points: 0, moved: 0 })
    expect(standingAfter({ tier: 0, points: 0 }, -1)).toEqual({ tier: 0, points: 0, moved: 0 })
    expect(standingAfter({ tier: 1, points: -18 }, -3)).toEqual({ tier: 0, points: 0, moved: -1 })
    expect(standingAfter({ tier: 1, points: -10 }, -3)).toEqual({ tier: 1, points: -13, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: 29 }, 3)).toEqual({ tier: LEGEND, points: 32, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: -19 }, -1)).toEqual({ tier: LEGEND - 1, points: 0, moved: -1 })
  })
})
