import { describe, expect, it } from 'vitest'

import { BID_LADDER } from '../value'
import { after, auction } from './auction'

// Lesson 7's auction (SKATGO-161) against the two duels of the rules page: middlehand bids to forehand, rearhand
// to whoever is left, one number of the ladder at a time.

const said = (a: ReturnType<typeof auction>) => a.calls.map((c) => `${c.role[0]}:${c.say}${c.say === 'pass' ? '' : c.value}`)

describe('the auction', () => {
  it('lesson 7, first auction: forehand worth 20 holds 18 and 20 and passes at 22', () => {
    const a = auction({ forehand: 20, middlehand: 24, rearhand: 0 })
    expect(said(a)).toEqual(['m:bid18', 'f:hold18', 'm:bid20', 'f:hold20', 'm:bid22', 'f:pass', 'r:pass'])
    expect([a.declarer, a.bid]).toEqual(['middlehand', 22])
  })

  it('lesson 7, final auction: middlehand worth 27 bids forehand out at 22, holds rearhand to 27 and passes at 30', () => {
    const a = auction({ forehand: 20, middlehand: 27, rearhand: 30 })
    expect(said(a)).toEqual(['m:bid18', 'f:hold18', 'm:bid20', 'f:hold20', 'm:bid22', 'f:pass', 'r:bid23', 'm:hold23', 'r:bid24', 'm:hold24', 'r:bid27', 'm:hold27', 'r:bid30', 'm:pass'])
    expect([a.declarer, a.bid]).toEqual(['rearhand', 30])
    const learner = a.calls.filter((c) => c.role === 'middlehand')
    expect(learner.map((c) => `${c.turn}:${c.to}`)).toEqual([...Array(3).fill('speak:forehand'), ...Array(4).fill('answer:rearhand')])
  })

  it('names only numbers of the ladder, and the next one each time', () => {
    const a = auction({ forehand: 48, middlehand: 60, rearhand: 30 })
    const named = a.calls.filter((c) => c.say === 'bid').map((c) => c.value)
    for (const v of named) expect(BID_LADDER).toContain(v)
    expect(named).toEqual([...named].sort((x, y) => x - y))
    expect([a.declarer, a.bid]).toEqual(['middlehand', 50])
  })

  it('lets forehand take the game at 18 when the others pass, and passes it in when nobody will', () => {
    expect(said(auction({ forehand: 18, middlehand: 0, rearhand: 0 }))).toEqual(['m:pass', 'r:pass', 'f:bid18'])
    const none = auction({ forehand: 0, middlehand: 0, rearhand: 0 })
    expect([none.declarer, none.bid, none.calls.at(-1)?.turn]).toEqual([null, 0, 'alone'])
  })

  it('seats the others clockwise after the learner', () => {
    expect(after('forehand')).toEqual(['middlehand', 'rearhand'])
    expect(after('middlehand')).toEqual(['rearhand', 'forehand'])
    expect(after('rearhand')).toEqual(['forehand', 'middlehand'])
  })
})
