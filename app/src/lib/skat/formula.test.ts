import { describe, expect, it } from 'vitest'

import { type Contract, cards } from './cards'
import { settlementFormula, settlementRows } from './i18n'
import { type Declaration, settle } from './value'

// A deal's whole calculation in one line (SKATGO-127), on settlements the engine makes; the site's English words.

const hearts: Contract = { kind: 'suit', trump: 'H' }
const decl = (contract: Contract, extra: Partial<Declaration> = {}): Declaration => ({
  contract, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false, ...extra,
})
const play = (declarerPoints: number) => ({ declarerPoints, defenderPoints: 120 - declarerPoints, declarerTricks: 5, defenderTricks: 5 })
const mine = cards('C:J | S:J | H:J | H:A')

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

// The same calculation a step a row in the result card (SKATGO-145), ending in the player's own Seeger-Fabian score.
const rows = (r: ReturnType<typeof settlementRows>) => r.map((x) => `${x.label} | ${x.value}`)

describe('the settlement rows', () => {
  it('a won game of the player: base, multiplier, game value, the +50, the score', () => {
    const s = settle(decl(hearts), 18, mine, play(70))
    expect(rows(settlementRows(s, decl(hearts), 18, true, 'Lina'))).toEqual([
      'Hearts ♥ | 10', 'with 3 + game 1 | × 4', 'Game value | 40', 'Won | + 50', 'Your score | +90',
    ])
  })
  it('a lost game of the player doubles and takes 50 more', () => {
    const s = settle(decl(hearts), 18, mine, play(50))
    expect(rows(settlementRows(s, decl(hearts), 18, true, 'Lina')).slice(-2)).toEqual(['Lost | −2 × 40 − 50', 'Your score | −130'])
  })
  it('a defender scores 40 when the declarer loses, nothing when they win', () => {
    const lost = settle(decl(hearts), 18, mine, play(50))
    expect(rows(settlementRows(lost, decl(hearts), 18, false, 'Lina')).slice(-2)).toEqual(['Lina lost: each defender | +40', 'Your score | +40'])
    const won = settle(decl(hearts), 18, mine, play(70))
    expect(rows(settlementRows(won, decl(hearts), 18, false, 'Lina')).slice(-2)).toEqual(['Lina won | +90', 'Your score | 0'])
  })
  it('Null has its fixed value in one row', () => {
    const nul = decl({ kind: 'null' }, { hand: true })
    const s = settle(nul, 18, mine, { declarerPoints: 0, defenderPoints: 120, declarerTricks: 0, defenderTricks: 10 })
    expect(rows(settlementRows(s, nul, 18, true, 'Lina'))).toEqual(['Null Hand, fixed value | 35', 'Won | + 50', 'Your score | +85'])
  })
  it('an overbid has its own row with what it is scored at', () => {
    const s = settle(decl(hearts), 46, mine, play(70))
    expect(rows(settlementRows(s, decl(hearts), 46, true, 'Lina'))).toContain(`Overbid: bid 46, scored at | ${s.value}`)
  })
})
