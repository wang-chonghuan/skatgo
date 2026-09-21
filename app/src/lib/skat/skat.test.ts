import { describe, expect, it } from 'vitest'

import { type Contract, cards, fullDeck, legalPlays, pointsOf, shuffle, trickWinnerIndex, trumpSequence } from './cards'
import { actor, adviceFor, aiBid, aiDeclare, bidAction, collectTrick, deal, playCard } from './game'
import { BID_LADDER, type Declaration, matadors, settle } from './value'

// Expected values here come from the International Skat Order, not from running the code.

const hearts: Contract = { kind: 'suit', trump: 'H' }
const grand: Contract = { kind: 'grand' }
const nullGame: Contract = { kind: 'null' }
const decl = (contract: Contract, extra: Partial<Declaration> = {}): Declaration => ({
  contract, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false, ...extra,
})

describe('the deck', () => {
  it('has 32 cards worth 120 points', () => {
    expect(fullDeck()).toHaveLength(32)
    expect(pointsOf(fullDeck())).toBe(120)
  })
  it('has eleven trumps in a suit game, four in Grand, none in Null', () => {
    expect(trumpSequence(hearts)).toHaveLength(11)
    expect(trumpSequence(grand)).toHaveLength(4)
    expect(trumpSequence(nullGame)).toHaveLength(0)
  })
})

describe('following suit', () => {
  it('a Jack is a trump, not a card of its printed suit', () => {
    const hand = cards('C:J 7 | D:A')
    expect(legalPlays(hand, cards('C:A'), hearts)).toEqual(cards('C:7'))
  })
  it('a trump lead must be followed with a Jack when that is the only trump held', () => {
    const hand = cards('S:J | C:A 10')
    expect(legalPlays(hand, cards('H:7'), hearts)).toEqual(cards('S:J'))
  })
  it('anything goes when void', () => {
    const hand = cards('S:J | D:A')
    expect(legalPlays(hand, cards('C:A'), hearts)).toHaveLength(2)
  })
  it('in Null a Jack follows its own suit', () => {
    const hand = cards('C:J | D:A')
    expect(legalPlays(hand, cards('C:7'), nullGame)).toEqual(cards('C:J'))
  })
})

describe('who takes the trick', () => {
  it('the ten outranks the king', () => {
    expect(trickWinnerIndex(cards('C:K 10 9'), hearts)).toBe(1)
  })
  it('the lowest trump beats any plain ace', () => {
    expect(trickWinnerIndex(cards('C:A | H:7 | C:10'), hearts)).toBe(1)
  })
  it('jacks rank clubs, spades, hearts, diamonds', () => {
    expect(trickWinnerIndex(cards('D:J | H:A | S:J'), hearts)).toBe(2)
    expect(trickWinnerIndex(cards('H:J | C:J | S:J'), grand)).toBe(1)
  })
  it('a discard of another suit never wins', () => {
    expect(trickWinnerIndex(cards('D:7 | C:A | S:A'), hearts)).toBe(0)
  })
  it('in Null the order is A K Q J 10 9 8 7', () => {
    expect(trickWinnerIndex(cards('C:10 J 9'), nullGame)).toBe(1)
    expect(trickWinnerIndex(cards('C:10 | C:Q | S:A'), nullGame)).toBe(1)
  })
})

describe('matadors', () => {
  it('counts "with" from the club Jack down', () => {
    expect(matadors(cards('C:J | S:J | D:J | H:A'), hearts)).toEqual({ with: true, count: 2 })
  })
  it('counts "without" until the first trump held', () => {
    expect(matadors(cards('H:J | D:J | H:A'), hearts)).toEqual({ with: false, count: 2 })
  })
  it('runs into the trump suit', () => {
    expect(matadors(cards('C:J | S:J | H:J | D:J | H:A 10 Q'), hearts)).toEqual({ with: true, count: 6 })
  })
  it('stops at four in Grand', () => {
    expect(matadors(cards('C:A'), grand)).toEqual({ with: false, count: 4 })
  })
})

describe('settlement', () => {
  const win = { declarerPoints: 70, defenderPoints: 50, declarerTricks: 6, defenderTricks: 4 }
  it('hearts with two, game three: 30', () => {
    const s = settle(decl(hearts), 20, cards('C:J | S:J | H:A'), win)
    expect(s).toMatchObject({ won: true, value: 30, score: 30 })
  })
  it('a lost game costs double', () => {
    const s = settle(decl(hearts), 20, cards('C:J | S:J | H:A'), { ...win, declarerPoints: 60, defenderPoints: 60 })
    expect(s).toMatchObject({ won: false, value: 30, score: -60 })
  })
  it('60 points is not enough', () => {
    expect(settle(decl(grand), 18, cards('C:J'), { ...win, declarerPoints: 60, defenderPoints: 60 }).won).toBe(false)
  })
  it('overbidding loses at the next multiple that covers the bid', () => {
    const s = settle(decl(hearts), 33, cards('C:J | S:J | H:A'), win)
    expect(s).toMatchObject({ won: false, overbid: true, value: 40, score: -80 })
  })
  it('an achieved Schneider can rescue a bid', () => {
    const s = settle(decl(hearts), 33, cards('C:J | S:J | H:A'), { ...win, declarerPoints: 92, defenderPoints: 28 })
    expect(s).toMatchObject({ won: true, overbid: false, value: 40 })
  })
  it('hand and announced Schneider: clubs with one, game, hand, schneider, announced = 5 × 12', () => {
    const s = settle(decl({ kind: 'suit', trump: 'C' }, { hand: true, schneiderAnnounced: true }), 18, cards('C:J'), {
      ...win, declarerPoints: 95, defenderPoints: 25,
    })
    expect(s).toMatchObject({ won: true, value: 60 })
  })
  it('an announced Schneider that falls short is lost', () => {
    const s = settle(decl(grand, { hand: true, schneiderAnnounced: true }), 18, cards('C:J'), win)
    expect(s.won).toBe(false)
  })
  it('Null is 23 / 35 / 46 / 59 and is won by taking no trick', () => {
    const none = { declarerPoints: 0, defenderPoints: 120, declarerTricks: 0, defenderTricks: 10 }
    expect(settle(decl(nullGame), 18, [], none)).toMatchObject({ won: true, score: 23 })
    expect(settle(decl(nullGame, { hand: true }), 18, [], none).value).toBe(35)
    expect(settle(decl(nullGame, { ouvert: true }), 18, [], none).value).toBe(46)
    expect(settle(decl(nullGame, { hand: true, ouvert: true }), 18, [], none).value).toBe(59)
    expect(settle(decl(nullGame), 18, [], { ...none, declarerTricks: 1 })).toMatchObject({ won: false, score: -46 })
  })
})

describe('the bidding ladder', () => {
  it('starts 18 20 22 23 24 27 30 33 35 36 40 44 45 46 48 50', () => {
    expect(BID_LADDER.slice(0, 16)).toEqual([18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 45, 46, 48, 50])
  })
  it('tops out at Grand ouvert with four: 264', () => {
    expect(BID_LADDER[BID_LADDER.length - 1]).toBe(264)
  })
})

describe('a whole game between three computers', () => {
  // A seeded generator: a failure must be reproducible, and Math.random would make it a rumour.
  function seeded(seed: number) {
    let s = seed
    return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
  }

  it('always reaches a settlement that accounts for every point', () => {
    let played = 0
    for (let seed = 1; seed <= 300; seed++) {
      let g = deal((seed % 3) as 0 | 1 | 2, shuffle(fullDeck(), seeded(seed)))
      while (g.phase === 'bidding') g = bidAction(g, aiBid(g))
      if (g.phase === 'passedIn') continue
      g = aiDeclare(g)
      expect(g.hands.map((h) => h.length)).toEqual([10, 10, 10])
      expect(g.skat).toHaveLength(2)
      let guard = 0
      while (g.phase !== 'done' && guard++ < 100) {
        if (g.phase === 'trickEnd') g = collectTrick(g)
        else g = playCard(g, adviceFor(g, actor(g)!)!.card)
      }
      expect(g.phase).toBe('done')
      const r = g.result!
      if (g.declaration!.contract.kind !== 'null') expect(r.declarerPoints + r.defenderPoints).toBe(120)
      expect(r.score).toBe(r.won ? r.value : -2 * r.value)
      played++
    }
    // The heuristics must actually bid on a reasonable share of deals, or this loop proved nothing.
    expect(played).toBeGreaterThan(100)
  })
})
