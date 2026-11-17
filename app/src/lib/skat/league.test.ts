import { describe, expect, it } from 'vitest'

import { DEAL_POINTS, FEES, LEGEND, PROMOTE_AT, RELEGATE_AT, TIERS, dealOutcome, standingAfter } from './league'

// The League's numbers as SKATGO-205 sets them: six tiers and their fees per deal; per deal +3 when one's side won, −3 for
// one's own game lost, −1 for the declarer's game made against one, 0 when all passed; +30 up and −20 down from 0 again,
// no relegation from Bronze, no promotion from Legend.

describe('the League', () => {
  it('has six tiers, Bronze to Legend, and their fees per deal', () => {
    expect(TIERS).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'])
    expect(FEES).toEqual([3, 4, 5, 7, 8, 10])
    expect(DEAL_POINTS).toEqual({ won: 3, lost: -3, defended: -1, passed: 0 })
    expect([PROMOTE_AT, RELEGATE_AT]).toEqual([30, -20])
  })

  it('scores a deal by how one’s own side came out of it', () => {
    expect(dealOutcome(1, true, 1)).toBe('won')
    expect(dealOutcome(1, false, 1)).toBe('lost')
    expect(dealOutcome(1, true, 0)).toBe('defended')
    expect(dealOutcome(1, false, 2)).toBe('won')
    expect(dealOutcome(null, false, 0)).toBe('passed')
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
    expect(standingAfter({ tier: 0, points: -19 }, -3)).toEqual({ tier: 0, points: RELEGATE_AT, moved: 0 })
    expect(standingAfter({ tier: 0, points: RELEGATE_AT }, -1)).toEqual({ tier: 0, points: RELEGATE_AT, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: 29 }, 3)).toEqual({ tier: LEGEND, points: 32, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: -19 }, -1)).toEqual({ tier: LEGEND - 1, points: 0, moved: -1 })
  })
})
