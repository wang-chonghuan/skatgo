import { describe, expect, it } from 'vitest'

import { FEES, LEGEND, PLACE_POINTS, PROMOTE_AT, RELEGATE_AT, TIERS, placesOf, standingAfter } from './league'

// The League's numbers as the ticket sets them (SKATGO-204): six tiers and their fees, +3 / +1 / −2 by place, equal
// totals sharing the better place, +12 up and −8 down from 0 again, no relegation from Bronze, no promotion from Legend.

describe('the League', () => {
  it('has six tiers, Bronze to Legend, and their fees', () => {
    expect(TIERS).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'])
    expect(FEES).toEqual([10, 12, 15, 20, 25, 30])
    expect(PLACE_POINTS).toEqual([3, 1, -2])
    expect([PROMOTE_AT, RELEGATE_AT]).toEqual([12, -8])
  })

  it('places by Seeger-Fabian total, equal totals sharing the better place', () => {
    expect(placesOf([120, -30, 45])).toEqual([0, 2, 1])
    expect(placesOf([50, 50, 10])).toEqual([0, 0, 2])
    expect(placesOf([90, 20, 20])).toEqual([0, 1, 1])
    expect(placesOf([0, 0, 0])).toEqual([0, 0, 0])
  })

  it('adds the place’s points', () => {
    expect(standingAfter({ tier: 2, points: 4 }, 0)).toEqual({ tier: 2, points: 7, moved: 0 })
    expect(standingAfter({ tier: 2, points: 4 }, 1)).toEqual({ tier: 2, points: 5, moved: 0 })
    expect(standingAfter({ tier: 2, points: 4 }, 2)).toEqual({ tier: 2, points: 2, moved: 0 })
  })

  it('moves up at +12 and down at −8, starting again from 0', () => {
    expect(standingAfter({ tier: 1, points: 9 }, 0)).toEqual({ tier: 2, points: 0, moved: 1 })
    expect(standingAfter({ tier: 3, points: -6 }, 2)).toEqual({ tier: 2, points: 0, moved: -1 })
    expect(standingAfter({ tier: 3, points: 10 }, 1)).toEqual({ tier: 3, points: 11, moved: 0 })
  })

  it('never relegates from Bronze, never promotes from Legend', () => {
    expect(standingAfter({ tier: 0, points: -7 }, 2)).toEqual({ tier: 0, points: RELEGATE_AT, moved: 0 })
    expect(standingAfter({ tier: 0, points: RELEGATE_AT }, 2)).toEqual({ tier: 0, points: RELEGATE_AT, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: 11 }, 0)).toEqual({ tier: LEGEND, points: 14, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: -7 }, 2)).toEqual({ tier: LEGEND - 1, points: 0, moved: -1 })
  })
})
