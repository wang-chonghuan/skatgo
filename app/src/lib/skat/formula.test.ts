import { describe, expect, it } from 'vitest'

import { type Contract, cards } from './cards'
import { settlementFormula } from './i18n'
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
