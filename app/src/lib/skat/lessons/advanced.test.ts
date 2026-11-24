import { describe, expect, it } from 'vitest'

import { type Locale, locales } from '~/paraglide/runtime'
import { type Card, type Contract, beats, cardId, cards, fullDeck, isTrump, legalPlays, pointsOf, sameCard, trickWinnerIndex } from '../cards'
import { type Position, splits, sureOf } from '../tricks/exercises/solve'
import { settle } from '../value'
import { ADVANCED, ADVANCED_GUIDES } from './advanced'
import type { ChoiceStep, Lesson, PlayStep, Step } from './types'

// The advanced course (SKATGO-234): every claim of a lesson is a claim about the rules, so each is proven here with the
// rules engine and the solver — a hand-written answer cannot teach a false one. Both languages say the same.

const step = <K extends Step['kind']>(lesson: Lesson, i: number, kind: K) => {
  const s = lesson.steps[i]
  expect(s.kind, `${lesson.id} step ${i}`).toBe(kind)
  return s as Extract<Step, { kind: K }>
}
const chosen = (s: ChoiceStep) => s.options[s.answer]
const without = (all: Card[], out: Card[]) => all.filter((c) => !out.some((d) => sameCard(c, d)))
const hand = (spec: string) => cards(spec)

describe('the advanced course', () => {
  it('exists in every language with the same lessons, cards and answers', () => {
    const ref = ADVANCED.en
    for (const locale of locales) {
      const course = ADVANCED[locale]
      expect(course.map((l) => [l.id, l.minutes, l.steps.map((s) => s.kind)])).toEqual(ref.map((l) => [l.id, l.minutes, l.steps.map((s) => s.kind)]))
      course.forEach((lesson, li) =>
        lesson.steps.forEach((s, si) => {
          const o = ref[li].steps[si]
          if (s.kind === 'choice' && o.kind === 'choice') expect([s.answer, s.options.length, s.rows?.map((r) => r.cards)]).toEqual([o.answer, o.options.length, o.rows?.map((r) => r.cards)])
          if (s.kind === 'play' && o.kind === 'play') expect([s.contract, s.hand, s.trick, s.best]).toEqual([o.contract, o.hand, o.trick, o.best])
          if (s.kind === 'teach' && o.kind === 'teach') expect(s.rows?.map((r) => r.cards)).toEqual(o.rows?.map((r) => r.cards))
        }),
      )
      expect(Object.keys(ADVANCED_GUIDES[locale]).sort()).toEqual(course.map((l) => l.id).sort())
    }
  })

  it('keeps its ids and addresses apart from the course and from each other', () => {
    for (const locale of locales) for (const l of ADVANCED[locale]) expect(Number(l.id)).toBeGreaterThan(100)
    const slugs = locales.flatMap((l) => Object.values(ADVANCED_GUIDES[l]).map((g) => g.slug))
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
    for (const l of locales) for (const g of Object.values(ADVANCED_GUIDES[l])) {
      expect(g.description.length).toBeGreaterThanOrEqual(120)
      expect(g.description.length).toBeLessThanOrEqual(160)
    }
  })

  it('every best play is a legal card', () => {
    for (const locale of locales as Locale[]) {
      for (const l of ADVANCED[locale]) for (const s of l.steps) {
        if (s.kind !== 'play') continue
        const legal = legalPlays(s.hand, s.trick, s.contract)
        for (const c of s.best ?? []) expect(legal.some((d) => sameCard(c, d))).toBe(true)
      }
    }
  })
})

describe('Schneider (lesson 101)', () => {
  const lesson = ADVANCED.en.find((l) => l.id === '101')!

  it('counts the defenders\' tricks to 28: Schneider', () => {
    const s = step(lesson, 1, 'choice')
    const points = pointsOf(s.rows!.flatMap((r) => r.cards))
    expect(points).toBe(28)
    expect(points).toBeLessThanOrEqual(30)
    expect(chosen(s)).toContain('28')
  })

  it('values a ♥ game with 2, Hand, Schneider announced and made at 60', () => {
    const s = step(lesson, 3, 'choice')
    const declarer = hand('C:J | S:J | H:A 10 K Q 9 8 | D:A 10') // with 2: ♣B ♠B, not ♥B
    const r = settle({ contract: { kind: 'suit', trump: 'H' }, hand: true, schneiderAnnounced: true, schwarzAnnounced: false, ouvert: false }, 18, declarer, {
      declarerPoints: 95, defenderPoints: 25, declarerTricks: 8, defenderTricks: 2,
    })
    expect(r.won).toBe(true)
    expect(r.value).toBe(60)
    expect(chosen(s)).toBe('60')
  })

  it('values a ♠ game with 2 at 33, 44 with a Schneider, and scores 87 on a bid of 44 as an overbid, −88', () => {
    const declarer = hand('C:J | S:J A 10 K Q 9 | H:A | D:A 10 | C:A')
    const plain = { contract: { kind: 'suit', trump: 'S' } as Contract, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false }
    const outcome = (points: number) => ({ declarerPoints: points, defenderPoints: 120 - points, declarerTricks: 7, defenderTricks: 3 })
    expect(settle(plain, 18, declarer, outcome(70)).value).toBe(33)
    expect(settle(plain, 18, declarer, outcome(92)).value).toBe(44)
    const r = settle(plain, 44, declarer, outcome(87))
    expect([r.won, r.overbid, r.score]).toEqual([false, true, -88])
    expect(chosen(step(lesson, 5, 'choice'))).toContain('88')
  })

  it('makes the 90 sure by drawing the last trump first, and only so', () => {
    const s: PlayStep = step(lesson, 7, 'play')
    // Three tricks left: the declarer leads; the only trump out is ♠B, and no heart is out — the worst case for a heart.
    const out = hand('S:J | D:A 10 7 | C:K 7')
    const worlds: Position[] = splits(out, 3).map(([a, b]) => ({ hands: [s.hand, a, b], trick: [], turn: 0 }))
    const need = 90 - 60
    expect(pointsOf([...s.hand, ...out])).toBe(50)
    const sure = (lead: Card) =>
      sureOf(worlds.map((w) => {
        const trick = [{ seat: 0 as const, card: lead }]
        return { hands: [without(w.hands[0], [lead]), w.hands[1], w.hands[2]], trick, turn: 1 }
      }), s.contract, 0, need)
    const winners = s.hand.filter(sure)
    expect(winners.map(cardId)).toEqual((s.best ?? []).map(cardId))
  })

  it('announces Schneider on the Grand Hand: one trick to lose, at most 22 in it', () => {
    const s = step(lesson, 9, 'choice')
    const mine = s.rows![0].cards
    expect(mine).toHaveLength(10)
    const grand: Contract = { kind: 'grand' }
    const out = without(fullDeck(), mine)
    // No trump is out, and every card but the ♥7 outranks every card out of its suit: the ♥7's trick is the only one lost.
    expect(out.some((c) => isTrump(c, grand))).toBe(false)
    const losers = mine.filter((d) => out.some((c) => c.suit === d.suit && !isTrump(c, grand) && !isTrump(d, grand) && beats(c, d, grand)))
    expect(losers.map(cardId)).toEqual(['H7'])
    // That trick holds the ♥7 and one card of each defender: at most the two fullest cards out.
    const fullest = [...out].sort((a, b) => pointsOf([b]) - pointsOf([a])).slice(0, 2)
    expect(pointsOf(fullest)).toBe(22)
    expect(pointsOf(fullest)).toBeLessThan(31)
    expect(chosen(s)).toContain('22')
  })

  it('smears the ♣10 into the partner\'s trick, and that alone gets the defenders to 31', () => {
    const s: PlayStep = step(lesson, 11, 'play')
    for (const card of legalPlays(s.hand, s.trick, s.contract)) {
      const trick = [...s.trick, card]
      expect(trickWinnerIndex(trick, s.contract)).toBe(0) // the partner's ♥A takes it
      const free = 9 + pointsOf(trick) >= 31
      expect(free, cardId(card)).toBe((s.best ?? []).some((c) => sameCard(c, card)))
    }
  })
})
