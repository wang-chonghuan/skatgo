import { describe, expect, it } from 'vitest'

import { AWAY_MS, CHECKIN_COINS, FEES, LEGEND, PROMOTE_AT, RELEGATE_AT, START_AT, TIERS, dealOutcome, dealPoints, forfeitPoints, leftOutcome, standingAfter } from './league'
import { seegerFabian } from './tournament'

// The League's numbers: six tiers and their fees per deal; per deal the seat's Seeger-Fabian score minus the average of the
// other two seats' (SKATGO-216), adding up to 0 at a table; each tier from 1000 (SKATGO-238), up at 2000 (SKATGO-237) and down at 0, the new tier
// from 1000 again, the same in every tier (SKATGO-219), Bronze stopping at 0, no promotion from Legend. A deal not seen to its end (SKATGO-206) is lost for the one who left; away a minute counts as
// leaving.

/** Seeger-Fabian of a deal at a three-player table, as a finished game gives it. */
const sf = (declarer: 0 | 1 | 2, won: boolean, value: number) =>
  seegerFabian({ phase: 'done', declarer, result: { won, value } as never })

describe('the League', () => {
  it('has six tiers, Bronze to Legend, and their fees per deal', () => {
    expect(TIERS).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'])
    expect(FEES).toEqual([4, 4, 4, 4, 4, 4])
    expect(AWAY_MS).toBe(60_000)
    expect(CHECKIN_COINS).toBe(90)
    expect([START_AT, PROMOTE_AT, RELEGATE_AT]).toEqual([1000, 2000, 0])
  })

  it('scores a deal as the seat’s Seeger-Fabian minus the other two’s average (SKATGO-216)', () => {
    // A game worth 36 won: the declarer 86, the defenders 0.
    const won = sf(1, true, 36)
    expect(won).toEqual([0, 86, 0])
    expect([0, 1, 2].map((s) => dealPoints(won, s))).toEqual([-43, 86, -43])
    // The same game lost: the declarer −122, each defender 40.
    const lost = sf(1, false, 36)
    expect(lost).toEqual([40, -122, 40])
    expect([0, 1, 2].map((s) => dealPoints(lost, s))).toEqual([81, -162, 81])
    // All passed: nothing.
    expect([0, 1, 2].map((s) => dealPoints([0, 0, 0], s))).toEqual([0, 0, 0])
    // A table adds up to 0; a half (an odd game value won) rounds to a whole number.
    for (const [d, w, v] of [[0, true, 18], [2, false, 120], [1, true, 23], [0, false, 59]] as const) {
      const pts = [0, 1, 2].map((s) => dealPoints(sf(d, w, v), s))
      expect(pts.every(Number.isInteger)).toBe(true)
      expect(Math.abs(pts.reduce((a, b) => a + b, 0))).toBeLessThanOrEqual(1)
    }
    expect(dealPoints(sf(0, true, 27), 1)).toBe(-38)
  })

  it('says how a deal came out for a seat', () => {
    expect(dealOutcome(1, true, 1)).toBe('won')
    expect(dealOutcome(1, false, 1)).toBe('lost')
    expect(dealOutcome(1, true, 0)).toBe('defended')
    expect(dealOutcome(1, false, 2)).toBe('won')
    expect(dealOutcome(null, false, 0)).toBe('passed')
  })

  it('loses a deal left before its end for the one who left (SKATGO-206, SKATGO-216)', () => {
    expect(leftOutcome(1, 1)).toBe('leftDeclaring')
    expect(leftOutcome(1, 0)).toBe('left')
    expect(leftOutcome(null, 2)).toBe('left')
    // Their own game lost at its value; the declarer's game made against them; nothing when all passed.
    expect(forfeitPoints(1, 36, 1)).toBe(dealPoints(sf(1, false, 36), 1))
    expect(forfeitPoints(1, 36, 0)).toBe(dealPoints(sf(1, true, 36), 0))
    expect(forfeitPoints(null, 0, 2)).toBe(0)
    // Never better than playing it out to a loss, and worse than any win.
    for (const v of [18, 24, 59, 120]) {
      expect(forfeitPoints(0, v, 0)).toBe(-2 * v - 90)
      expect(forfeitPoints(0, v, 2)).toBeLessThan(0)
    }
  })

  it('adds a deal’s points', () => {
    expect(standingAfter({ tier: 2, points: 1400 }, 86)).toEqual({ tier: 2, points: 1486, moved: 0 })
    expect(standingAfter({ tier: 2, points: 1400 }, -43)).toEqual({ tier: 2, points: 1357, moved: 0 })
    expect(standingAfter({ tier: 2, points: 1400 }, 0)).toEqual({ tier: 2, points: 1400, moved: 0 })
  })

  it('moves up at 2000 and down at 0, the new tier from 1000, the same lines in every tier (SKATGO-219, 237, 238)', () => {
    expect(standingAfter({ tier: 1, points: 1950 }, 86)).toEqual({ tier: 2, points: 1000, moved: 1 })
    expect(standingAfter({ tier: 1, points: 1914 }, 86)).toEqual({ tier: 2, points: 1000, moved: 1 })
    expect(standingAfter({ tier: 3, points: 1913 }, 86)).toEqual({ tier: 3, points: 1999, moved: 0 })
    expect(standingAfter({ tier: 3, points: 100 }, -162)).toEqual({ tier: 2, points: 1000, moved: -1 })
    expect(standingAfter({ tier: 3, points: 43 }, -43)).toEqual({ tier: 2, points: 1000, moved: -1 })
    expect(standingAfter({ tier: 3, points: 44 }, -43)).toEqual({ tier: 3, points: 1, moved: 0 })
    // Every tier but Legend goes up at 2000, every tier but Bronze down at 0, the new one from 1000.
    for (let tier = 0; tier < LEGEND; tier++) expect(standingAfter({ tier, points: 1999 }, 1)).toEqual({ tier: tier + 1, points: 1000, moved: 1 })
    for (let tier = 1; tier <= LEGEND; tier++) expect(standingAfter({ tier, points: 1 }, -1)).toEqual({ tier: tier - 1, points: 1000, moved: -1 })
  })

  it('never relegates from Bronze, never promotes from Legend', () => {
    // Bronze stops at 0 (SKATGO-207): never a negative.
    expect(standingAfter({ tier: 0, points: 20 }, -43)).toEqual({ tier: 0, points: 0, moved: 0 })
    expect(standingAfter({ tier: 0, points: 0 }, -162)).toEqual({ tier: 0, points: 0, moved: 0 })
    expect(standingAfter({ tier: 0, points: 1950 }, 86)).toEqual({ tier: 1, points: 1000, moved: 1 })
    expect(standingAfter({ tier: 1, points: 100 }, -162)).toEqual({ tier: 0, points: 1000, moved: -1 })
    // Legend runs on past 2000, and goes down at 0.
    expect(standingAfter({ tier: LEGEND, points: 1990 }, 86)).toEqual({ tier: LEGEND, points: 2076, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: 3500 }, 86)).toEqual({ tier: LEGEND, points: 3586, moved: 0 })
    expect(standingAfter({ tier: LEGEND, points: 10 }, -43)).toEqual({ tier: LEGEND - 1, points: 1000, moved: -1 })
  })
})
