import { describe, expect, it } from 'vitest'

import { cards } from './cards'
import { putAwayTips } from './put-away-tips'

// SKATGO-177: the put-away tips point at the twelve cards — the longest suit's trumps, the side cards whose points would be
// lost, the shortest side suit that can be emptied — and never name the card or the game.

describe('put-away tips', () => {
  it('the hand the human agreed on: seven trumps, two cards at risk, a side suit of one card', () => {
    const twelve = cards('C:J | H:J | S:A 10 K 9 7 | H:10 8 | D:K | C:A 9')
    expect(putAwayTips(twelve)).toEqual({ trumps: 7, atRisk: 2, short: 'one' })
  })

  it('lesson 8’s hands: a lone 10 is at risk, a lone 7 is not', () => {
    expect(putAwayTips(cards('C:J | H:J A 10 K 9 | S:A 7 | C:10 | D:K 8 7'))).toEqual({ trumps: 6, atRisk: 1, short: 'one' })
    // Spades and Clubs both have four; Spades has more points, so Spades is the longest and Clubs a side suit.
    expect(putAwayTips(cards('C:J | H:J | S:A 10 9 7 | C:A K 9 8 | H:10 | D:7'))).toEqual({ trumps: 6, atRisk: 1, short: 'one' })
  })

  it('an Ace keeps its suit: neither its 10 is at risk nor is it a suit to empty', () => {
    const twelve = cards('C:J | S:J | H:A 10 K Q 9 | S:A 10 | D:A 8 | C:A')
    expect(putAwayTips(twelve)).toEqual({ trumps: 7, atRisk: 0, short: 'none' })
  })

  it('a side suit already void, and two-card suits without an Ace', () => {
    expect(putAwayTips(cards('D:J | C:A 10 9 8 7 | S:K 9 | H:Q 9 | D:8 7'))).toEqual({ trumps: 6, atRisk: 0, short: 'two' })
    expect(putAwayTips(cards('D:J | H:J | C:A 10 9 8 7 Q | S:A K 9 | H:A'))).toEqual({ trumps: 8, atRisk: 0, short: 'void' })
  })
})
