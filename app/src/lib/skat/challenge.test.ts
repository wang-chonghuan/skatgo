import { describe, expect, it } from 'vitest'

import { type Card, fullDeck } from './cards'
import { CHALLENGE_BID, challengeStart, dealerFor, gameOfKind, longestSuit, nullSafe, ofKind, ownSlice } from './challenge'
import { actor, roleOf } from './game'

// Hard hands (SKATGO-248): the kinds' patterns, the games they are played with, and where a deal starts.

const cards = (s: string): Card[] => s.split(' ').map((c) => ({ suit: c[0] as Card['suit'], rank: (c.slice(1) === 'T' ? '10' : c.slice(1)) as Card['rank'] }))

describe('the kinds', () => {
  it('one Jack and five or six trumps is the one-Jack suit game, in its longest suit', () => {
    const hand = cards('DJ CA CT CK CQ C8 HA H7 S9 D7')
    expect(ofKind('one-jack-suit', hand)).toBe(true)
    expect(gameOfKind('one-jack-suit', hand)).toBe('C')
    expect(ofKind('one-jack-suit', cards('DJ HJ CA CT CK CQ C8 HA S9 D7'))).toBe(false)
  })
  it('four trumps or fewer in the best suit is a short-trump game', () => {
    const hand = cards('CJ HA HT HK SA ST S9 DA D7 C8')
    expect(longestSuit(hand)).toBe('S') // hearts and spades three each: the higher suit
    expect(ofKind('short-trumps', hand)).toBe(true)
    expect(ofKind('short-trumps', cards('CJ HA HT HK H9 SA ST DA D7 C8'))).toBe(false)
  })
  it('a Grand with one Jack', () => {
    expect(ofKind('one-jack-grand', cards('SJ CA CT HA HT SA D7 D8 C9 H7'))).toBe(true)
    expect(gameOfKind('one-jack-grand', cards('SJ CA CT HA HT SA D7 D8 C9 H7'))).toBe('G')
  })
  it('a Null suit is safe when every card has enough lower ones under it', () => {
    expect(nullSafe(cards('C7'), 'C')).toBe(true)
    expect(nullSafe(cards('C7 C9 CJ'), 'C')).toBe(true)
    expect(nullSafe(cards('C8'), 'C')).toBe(false)
    expect(nullSafe(cards('C7 CT'), 'C')).toBe(false)
    expect(nullSafe(cards('C7 C8 C9 CA'), 'C')).toBe(false)
    expect(nullSafe([], 'C')).toBe(true)
    expect(ofKind('null-weak-spot', cards('C7 C9 S7 S8 H7 H9 HJ D8 DT DQ'))).toBe(true)
    expect(ofKind('null-weak-spot', cards('C7 C9 S7 S8 H7 H9 HJ D7 D9 DJ'))).toBe(false)
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
