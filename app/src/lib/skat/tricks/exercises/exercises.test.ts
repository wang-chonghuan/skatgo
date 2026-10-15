import { describe, expect, it } from 'vitest'

import { type Card, cardId, fullDeck, legalPlays, sameCard, trickWinnerIndex } from '../../cards'
import { locales } from '~/paraglide/runtime'
import { EXERCISE_TEXT, EXERCISE_TYPES, EXERCISES } from '.'
import { MITZAEHLEN, cards } from './positions'

// The Skat-Tricks exercises (SKATGO-103) held to their ticket: twelve kinds, three each, every one in both
// languages, every card real and every move legal. The exact answers are computed when positions.ts loads —
// a position whose answer is not unique fails there; SkatZero's are checked in multiplayer/.

describe('the Skat-Tricks exercises', () => {
  it('twelve kinds, three exercises each, in the kinds\' order, each id once', () => {
    expect(EXERCISES).toHaveLength(36)
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(36)
    for (const type of EXERCISE_TYPES) expect(EXERCISES.filter((e) => e.type === type).map((e) => e.id)).toEqual([1, 2, 3].map((n) => `${type}-${n}`))
    expect(EXERCISES.map((e) => e.type)).toEqual(EXERCISE_TYPES.flatMap((t) => [t, t, t]))
  })

  for (const locale of locales) {
    it(`${locale}: every kind and every exercise has its words`, () => {
      const text = EXERCISE_TEXT[locale]
      for (const type of EXERCISE_TYPES) expect(text.types[type].title, type).toBeTruthy()
      expect(Object.keys(text.exercises).sort()).toEqual(EXERCISES.map((e) => e.id).sort())
      for (const e of EXERCISES) {
        const w = text.exercises[e.id]
        expect(w.title && w.prompt && w.explain, e.id).toBeTruthy()
        const own = e.ask.kind === 'choice' ? e.ask.options.filter((o) => o.kind === 'text').length : 0
        expect(w.options?.length ?? 0, e.id).toBe(own)
      }
    })
  }

  it('no card twice in what an exercise shows', () => {
    for (const e of EXERCISES) {
      const shown: Card[] = e.situation.rows.flatMap((r) => (r.kind === 'trick' ? r.plays.map((p) => p.card) : r.cards))
      const asked: Card[] = e.ask.kind === 'play' ? [...e.ask.hand, ...e.ask.trick.map((t) => t.card)] : e.ask.kind === 'pick' ? e.ask.cards : []
      const all = [...shown, ...asked]
      for (const c of all) expect(fullDeck().some((d) => sameCard(c, d)), `${e.id} ${cardId(c)}`).toBe(true)
      expect(new Set(all.map(cardId)).size, e.id).toBe(all.length)
    }
  })

  it('every answer is one of the options: a legal card, cards of the hand, an option offered', () => {
    for (const e of EXERCISES) {
      const a = e.ask
      if (a.kind === 'choice') expect(a.answer >= 0 && a.answer < a.options.length, e.id).toBe(true)
      if (a.kind === 'pick') {
        for (const c of a.correct) expect(a.cards.some((d) => sameCard(c, d)), e.id).toBe(true)
        expect(a.cards, e.id).toHaveLength(12)
        expect(a.correct, e.id).toHaveLength(2)
      }
      if (a.kind === 'play') {
        const legal = legalPlays(a.hand, a.trick.map((t) => t.card), a.contract)
        expect(a.best.length, e.id).toBeGreaterThan(0)
        for (const c of a.best) expect(legal.some((d) => sameCard(c, d)), `${e.id} ${cardId(c)}`).toBe(true)
        expect(legal.length, `${e.id}: a choice to make`).toBeGreaterThan(a.best.length)
      }
    }
  })

  it('the counting deals are whole deals, played by the rules', () => {
    for (const d of MITZAEHLEN) {
      const hands: Record<string, Card[]> = { you: d.you, left: d.left, right: d.right }
      expect(new Set([...d.you, ...d.left, ...d.right, ...d.skat].map(cardId)).size).toBe(32)
      let leader = 'you'
      for (const t of d.tricks) {
        expect(t[0][0]).toBe(leader)
        const order = ['you', 'left', 'right']
        const trick: Card[] = []
        t.forEach(([who, id], i) => {
          expect(who).toBe(order[(order.indexOf(leader) + i) % 3])
          const card = cards(id)[0]
          expect(legalPlays(hands[who], trick, d.contract).some((c) => sameCard(c, card)), `${who} ${id}`).toBe(true)
          hands[who] = hands[who].filter((c) => !sameCard(c, card))
          trick.push(card)
        })
        leader = t[trickWinnerIndex(trick, d.contract)][0]
      }
    }
  })
})
