import { describe, expect, it } from 'vitest'

import { type Card, fullDeck } from './cards'
import { CHALLENGE_BID, challengeStart, kindProgress, madeAim, dealerFor, gameOfKind, longestSuit, nullSafe, ofKind, ownSlice } from './challenge'
import { actor, roleOf } from './game'

// Hard hands (SKATGO-248): the kinds' patterns, the games they are played with, and where a deal starts.

const cards = (s: string): Card[] => s.split(' ').map((c) => ({ suit: c[0] as Card['suit'], rank: (c.slice(1) === 'T' ? '10' : c.slice(1)) as Card['rank'] }))

// SKATGO-249: a kind is judged on the twelve cards, the ten as dealt and the skat — the skat must not make it another kind.
describe('the kinds, with the skat', () => {
  it('one Jack and five or six trumps is the one-Jack suit game, in its longest suit', () => {
    const twelve = cards('DJ CA CT CK CQ HA H7 S9 D7 S8 D8 H8')
    expect(ofKind('one-jack-suit', twelve)).toBe(true)
    expect(gameOfKind('one-jack-suit', twelve)).toBe('C')
    // A Jack in the skat makes it two.
    expect(ofKind('one-jack-suit', cards('DJ CA CT CK CQ HA H7 S9 D7 S8 HJ H8'))).toBe(false)
    // Trumps from the skat make it seven.
    expect(ofKind('one-jack-suit', cards('DJ CA CT CK CQ C8 HA H7 S9 D7 C9 C7'))).toBe(false)
  })
  it('four trumps or fewer in the best suit, the skat counted, is a short-trump game', () => {
    const twelve = cards('CJ HA HT HK SA ST S9 DA D7 C8 C7 D9')
    expect(longestSuit(twelve)).toBe('S') // hearts and spades three each: the higher suit
    expect(ofKind('short-trumps', twelve)).toBe(true)
    expect(ofKind('short-trumps', cards('CJ HA HT HK SA ST S9 DA D7 C8 H9 C7'))).toBe(false)
  })
  it('a Grand with one Jack, none in the skat', () => {
    expect(ofKind('one-jack-grand', cards('SJ CA CT HA HT SA D7 D8 C9 H7 S7 S8'))).toBe(true)
    expect(ofKind('one-jack-grand', cards('SJ CA CT HA HT SA D7 D8 C9 H7 DJ S8'))).toBe(false)
    expect(gameOfKind('one-jack-grand', cards('SJ CA CT HA HT SA D7 D8 C9 H7 S7 S8'))).toBe('G')
  })
  it('a Null suit is safe when every card has enough lower ones under it', () => {
    expect(nullSafe(cards('C7'), 'C')).toBe(true)
    expect(nullSafe(cards('C7 C9 CJ'), 'C')).toBe(true)
    expect(nullSafe(cards('C8'), 'C')).toBe(false)
    expect(nullSafe(cards('C7 CT'), 'C')).toBe(false)
    expect(nullSafe(cards('C7 C8 C9 CA'), 'C')).toBe(false)
    expect(nullSafe([], 'C')).toBe(true)
  })
  it('a Null keeps one weak spot whichever two are put away', () => {
    // Diamonds 8 Ten Queen: putting two away leaves a weak diamond (D8 or DT or DQ alone, low card missing).
    expect(ofKind('null-weak-spot', cards('C7 C9 S7 S8 H7 H9 HJ D8 DT DQ C8 S9'))).toBe(true)
    // Two weak spots that two cards cannot both mend: three weak spades and three weak diamonds.
    expect(ofKind('null-weak-spot', cards('C7 C9 S8 SK SA H7 H9 D8 DT DQ C8 H8'))).toBe(false)
    // The weak spot put away: the skat's two let the Queen and King of spades go, nothing weak is left.
    expect(ofKind('null-weak-spot', cards('C7 C9 SQ SK H7 H9 HJ D7 D9 DJ C8 H8'))).toBe(false)
  })
})

// SKATGO-249: the Schneider kind — a hand anyone wins, its aim Schneider.
describe('the Schneider kind', () => {
  it('three or four Jacks is its Grand, seven trumps or more its suit game', () => {
    const grand = cards('CJ SJ HJ CA CT HA HT S7 S8 D7 D8 H7')
    expect(ofKind('schneider', grand)).toBe(true)
    expect(gameOfKind('schneider', grand)).toBe('G')
    const suit = cards('CJ DJ HA HT HK HQ H9 H8 SA S7 D7 C7')
    expect(ofKind('schneider', suit)).toBe(true)
    expect(gameOfKind('schneider', suit)).toBe('H')
    expect(ofKind('schneider', cards('CJ DJ HA HT HK HQ SA ST S9 S7 D7 C7'))).toBe(false) // six trumps at most
  })
  it('its aim is the game with Schneider; other kinds\' the game', () => {
    expect(madeAim('schneider', true, true)).toBe(true)
    expect(madeAim('schneider', true, false)).toBe(false)
    expect(madeAim('one-jack-suit', true, false)).toBe(true)
    expect(madeAim('one-jack-suit', false, false)).toBe(false)
  })
})

describe('the start', () => {
  it('seat 0 declares at the lowest bid, the skat not yet taken, from forehand or the bad seat\'s middlehand', () => {
    for (const seat of ['forehand', 'middlehand'] as const) {
      const dealer = dealerFor(seat)
      expect(roleOf(0, dealer)).toBe(seat)
      const deck = fullDeck()
      const g = challengeStart(dealer, deck)
      expect(g.phase).toBe('skat')
      expect(g.declarer).toBe(0)
      expect(g.bid).toBe(CHALLENGE_BID)
      expect(actor(g)).toBe(0)
      expect(g.hands[0]).toEqual(deck.slice(...ownSlice(dealer)))
    }
  })
})

// SKATGO-249: a kind's card counts the deals passed and opens the first not passed — the first again once all are.
describe('kindProgress', () => {
  it('counts the passed deals and opens the first not passed', () => {
    expect(kindProgress({}, 'bad-seat')).toEqual({ done: 0, next: 1 })
    expect(kindProgress({ 'bad-seat': [1, 2, 4] }, 'bad-seat')).toEqual({ done: 3, next: 3 })
    expect(kindProgress({ 'bad-seat': [2] }, 'bad-seat')).toEqual({ done: 1, next: 1 })
    expect(kindProgress({ 'bad-seat': [1] }, 'null-weak-spot')).toEqual({ done: 0, next: 1 })
  })
  it('opens the first deal again when all are passed', () => {
    expect(kindProgress({ 'one-jack-grand': Array.from({ length: 30 }, (_, i) => i + 1) }, 'one-jack-grand')).toEqual({ done: 30, next: 1 })
  })
})
