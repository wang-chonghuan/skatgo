import { describe, expect, it } from 'vitest'

import { type Contract, cards } from './cards'
import { calcLine, resultReason, settlementFormula } from './i18n'
import { type Declaration, settle } from './value'

// A deal's whole calculation in one line (SKATGO-127), on settlements the engine makes; the site's English words.

const hearts: Contract = { kind: 'suit', trump: 'H' }
const decl = (contract: Contract, extra: Partial<Declaration> = {}): Declaration => ({
  contract, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false, ...extra,
})
const play = (declarerPoints: number) => ({ declarerPoints, defenderPoints: 120 - declarerPoints, declarerTricks: 5, defenderTricks: 5 })
const mine = cards('C:J | S:J | H:J | H:A')
/** A settlement with the card points the game adds to it. */
const result = (d: Declaration, bid: number, p: ReturnType<typeof play>) => ({ ...settle(d, bid, mine, p), declarerPoints: p.declarerPoints, defenderPoints: p.defenderPoints })

describe('the settlement formula', () => {
  it('a won game: the parts, the multiplier, base × multiplier and the score', () => {
    const s = settle(decl(hearts), 18, mine, play(70))
    expect(settlementFormula(s, decl(hearts), 18, false)).toBe('with 3 + game 1 → multiplier 4; Hearts ♥ base value 10 × 4 = 40 · won: +40')
  })
  it('Schneider adds to the multiplier', () => {
    const s = settle(decl(hearts), 18, mine, play(95))
    expect(settlementFormula(s, decl(hearts), 18, false)).toContain('+ Schneider 1 → multiplier 5; Hearts ♥ base value 10 × 5 = 50 · won: +50')
  })
  it('a lost game doubles', () => {
    const s = settle(decl(hearts), 18, mine, play(50))
    expect(settlementFormula(s, decl(hearts), 18, false)).toContain('· lost: −2 × 40 = −80')
  })
  it('an overbid says the bid and what it is scored at', () => {
    const s = settle(decl(hearts), 46, mine, play(70))
    expect(s.overbid).toBe(true)
    expect(settlementFormula(s, decl(hearts), 46, false)).toContain(`overbid: the bid 46 is above 40, so it is scored at ${s.value} · lost: −2 × ${s.value} = −${-s.score}`)
  })
  it('where the table counts Seeger-Fabian, a won game adds 50', () => {
    const s = settle(decl(hearts), 18, mine, play(70))
    expect(settlementFormula(s, decl(hearts), 18, true)).toContain('= 40 · won: 40 + 50 = +90 (Seeger-Fabian)')
  })
  it('and a lost one takes 50 more and gives each defender 40', () => {
    const s = settle(decl(hearts), 18, mine, play(50))
    expect(settlementFormula(s, decl(hearts), 18, true)).toContain('· lost: −2 × 40 − 50 = −130 (Seeger-Fabian), each defender +40')
  })
})

// The after-deal result (SKATGO-166): the line under the headline says why, the calculation line how the score is counted
// — without the score, which only the table shows.
describe('the result line', () => {
  it('a suit game: the card points, Schneider when made', () => {
    expect(resultReason(result(decl(hearts), 18, play(70)), decl(hearts))).toBe('70 : 50 card points')
    expect(resultReason(result(decl(hearts), 18, play(95)), decl(hearts))).toBe('95 : 25 card points · Schneider')
  })
  it('a Null: whether the declarer took a trick', () => {
    const nul = decl({ kind: 'null' })
    expect(resultReason(result(nul, 18, { declarerPoints: 0, defenderPoints: 120, declarerTricks: 0, defenderTricks: 10 }), nul)).toBe('No trick taken')
    expect(resultReason(result(nul, 18, { declarerPoints: 10, defenderPoints: 110, declarerTricks: 1, defenderTricks: 9 }), nul)).toBe('Took a trick')
  })
  it('an overbid and a claim follow the card points', () => {
    const s = result(decl(hearts), 46, play(70))
    expect(resultReason(s, decl(hearts), { kind: 'claim', from: 6 })).toBe('70 : 50 card points · overbid: worth 40, bid 46 · last 4 tricks claimed')
  })
})

describe('the calculation line', () => {
  it('a won game: base × multiplier with its parts, then the +50, no result', () => {
    expect(calcLine(settle(decl(hearts), 18, mine, play(70)), decl(hearts))).toBe('Hearts ♥ 10 × 4 (with 3 + game 1) = 40 · won: 40 + 50')
  })
  it('a lost game: doubled and 50 more; the defenders\' 40 is the table\'s', () => {
    expect(calcLine(settle(decl(hearts), 18, mine, play(50)), decl(hearts))).toBe('Hearts ♥ 10 × 4 (with 3 + game 1) = 40 · lost: −2 × 40 − 50')
  })
  it('Null: its fixed value', () => {
    const nul = decl({ kind: 'null' }, { hand: true })
    const s = settle(nul, 18, mine, { declarerPoints: 0, defenderPoints: 120, declarerTricks: 0, defenderTricks: 10 })
    expect(calcLine(s, nul)).toBe('Null Hand: 35 · won: 35 + 50')
  })
  it('an overbid: what it is scored at', () => {
    const s = settle(decl(hearts), 46, mine, play(70))
    expect(calcLine(s, decl(hearts))).toBe(`Hearts ♥ 10 × 4 (with 3 + game 1) = 40 · overbid, scored at ${s.value} · lost: −2 × ${s.value} − 50`)
  })
})
