import { describe, expect, it } from 'vitest'

import { ELO_KI, ELO_START, eloK, eloRatings } from './elo'

// The tournament's Elo (SKATGO-123), held to the worked examples a player can check by hand.

describe('the tournament Elo', () => {
  it('a day against the KI alone: a win is +30, a loss −10 from the start', () => {
    expect(ELO_START).toBe(1500)
    expect(ELO_KI).toBe(1700)
    const won = eloRatings([{ ki: 100, totals: [{ player: 'a', total: 120 }] }]).get('a')!
    const lost = eloRatings([{ ki: 100, totals: [{ player: 'a', total: 80 }] }]).get('a')!
    expect(Math.round(won.elo)).toBe(1530)
    expect(Math.round(lost.elo)).toBe(1490)
    expect(won.days).toBe(1)
  })
  it('a day against a field: each opponent a game, the score and its expectation averaged', () => {
    // Anna 1600 and Max 1450 from earlier days; today you (1500) beat both and lose to the KI: +11.
    const days = [
      { ki: null, totals: [{ player: 'anna', total: 300 }, { player: 'x', total: 0 }] },
      { ki: null, totals: [{ player: 'anna', total: 300 }, { player: 'x', total: 0 }] },
      { ki: null, totals: [{ player: 'anna', total: 300 }, { player: 'max', total: 0 }] },
    ]
    const before = eloRatings(days)
    const anna = before.get('anna')!.elo
    const max = before.get('max')!.elo
    const today = eloRatings([...days, { ki: 260, totals: [{ player: 'you', total: 210 }, { player: 'anna', total: 180 }, { player: 'max', total: -30 }] }])
    const expected = (1 / (1 + 10 ** ((anna - 1500) / 400)) + 1 / (1 + 10 ** ((max - 1500) / 400)) + 1 / (1 + 10 ** ((1700 - 1500) / 400))) / 3
    expect(today.get('you')!.elo).toBeCloseTo(1500 + 40 * (2 / 3 - expected), 9)
  })
  it('equal totals draw; a player alone on a day without the KI has no game', () => {
    const drawn = eloRatings([{ ki: 50, totals: [{ player: 'a', total: 50 }] }]).get('a')!
    expect(drawn.elo).toBeCloseTo(1500 + 40 * (0.5 - 1 / (1 + 10 ** (200 / 400))), 9)
    expect(eloRatings([{ ki: null, totals: [{ player: 'a', total: 50 }] }]).has('a')).toBe(false)
  })
  it('K is 40 for the first 30 days, 20 after', () => {
    expect(eloK(0)).toBe(40)
    expect(eloK(29)).toBe(40)
    expect(eloK(30)).toBe(20)
  })
})
