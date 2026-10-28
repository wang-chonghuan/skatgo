import { describe, expect, it } from 'vitest'

import { cards } from './cards'
import { faceOf } from './face'
import { type Game, deal } from './game'

// Lina's and Noah's faces (SKATGO-147): the bidding's winner laughs until the first card; a trick's side laughs, the other sulks.

const base = deal(0)
const at = (extra: Partial<Game>): Game => ({ ...base, ...extra })
const grand = { contract: { kind: 'grand' as const }, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false }
// Lina (1) leads the club jack, which takes the trick in a Grand.
const trick = cards('C:J | S:7 | H:7').map((card, i) => ({ seat: ([1, 2, 0] as const)[i], card }))

describe('the faces', () => {
  it('everyone is neutral while bidding', () => {
    expect([faceOf(base, 1), faceOf(base, 2)]).toEqual(['neutral', 'neutral'])
  })
  it('the bidding winner laughs until the first card, the other stays neutral', () => {
    expect(faceOf(at({ phase: 'skat', declarer: 1 }), 1)).toBe('laugh')
    expect(faceOf(at({ phase: 'skat', declarer: 1 }), 2)).toBe('neutral')
    expect(faceOf(at({ phase: 'play', declarer: 1, declaration: grand }), 1)).toBe('laugh')
    expect(faceOf(at({ phase: 'play', declarer: 1, declaration: grand, trick: trick.slice(0, 1) }), 1)).toBe('neutral')
  })
  it('a trick the declarer takes: the declarer laughs, the defenders sulk', () => {
    const g = at({ phase: 'trickEnd', declarer: 1, declaration: grand, trick })
    expect([faceOf(g, 1), faceOf(g, 2)]).toEqual(['laugh', 'sad'])
  })
  it('a trick the defenders take: both defenders laugh, the declarer sulks', () => {
    const lina = at({ phase: 'trickEnd', declarer: 2, declaration: grand, trick })
    expect([faceOf(lina, 1), faceOf(lina, 2)]).toEqual(['laugh', 'sad'])
    const you = at({ phase: 'trickEnd', declarer: 0, declaration: grand, trick })
    expect([faceOf(you, 1), faceOf(you, 2)]).toEqual(['laugh', 'laugh'])
  })
  it('a Null the other way round: the declarer taking a trick sulks, the defenders laugh', () => {
    const nul = { ...grand, contract: { kind: 'null' as const } }
    const g = at({ phase: 'trickEnd', declarer: 1, declaration: nul, trick })
    expect([faceOf(g, 1), faceOf(g, 2)]).toEqual(['sad', 'laugh'])
    const dodged = at({ phase: 'trickEnd', declarer: 2, declaration: nul, trick })
    expect([faceOf(dodged, 1), faceOf(dodged, 2)]).toEqual(['sad', 'laugh'])
  })
  it('at the end the winning side laughs and the losing side sulks', () => {
    const result = (won: boolean) => ({ ...({} as NonNullable<Game['result']>), won })
    const linaWon = at({ phase: 'done', declarer: 1, declaration: grand, result: result(true) })
    expect([faceOf(linaWon, 1), faceOf(linaWon, 2)]).toEqual(['laugh', 'sad'])
    const linaLost = at({ phase: 'done', declarer: 1, declaration: grand, result: result(false) })
    expect([faceOf(linaLost, 1), faceOf(linaLost, 2)]).toEqual(['sad', 'laugh'])
    const youWon = at({ phase: 'done', declarer: 0, declaration: grand, result: result(true) })
    expect([faceOf(youWon, 1), faceOf(youWon, 2)]).toEqual(['sad', 'sad'])
  })
  it('neutral again once the trick is collected', () => {
    const g = at({ phase: 'play', declarer: 1, declaration: grand, tricks: [{ winner: 1, cards: trick }] })
    expect([faceOf(g, 1), faceOf(g, 2)]).toEqual(['neutral', 'neutral'])
  })
})
