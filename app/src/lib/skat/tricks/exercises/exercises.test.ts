import { describe, expect, it } from 'vitest'

import { type Card, cardId, fullDeck, legalPlays, sameCard, trickWinnerIndex } from '../../cards'
import { locales } from '~/paraglide/runtime'
import { EXERCISE_TEXT, EXERCISE_TYPES, EXERCISES } from '.'
import { ENDGAMES_STORED } from './endgames.data'
import { readEndgame, recordOf, solveEndgame } from './endgame'
import { MITZAEHLEN, cards } from './positions'

// The Skat-Tricks exercises (SKATGO-103) held to their ticket: the "Sieg sichern" ladder of ten (SKATGO-108)
// first, then twelve kinds of three, every one in both languages, every card real and every move legal. The exact answers are computed when positions.ts loads —
// a position whose answer is not unique fails there; SkatZero's are checked in multiplayer/.

describe('the Skat-Tricks exercises', () => {
  it('the ladder of ten first, then twelve kinds of three, in the kinds\' order, each id once', () => {
    const size = (type: string) => (type === 'sieg-sichern' ? 10 : 3)
    expect(EXERCISE_TYPES[0]).toBe('sieg-sichern')
    expect(EXERCISE_TYPES).toHaveLength(13)
    expect(EXERCISES).toHaveLength(46)
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(46)
    for (const type of EXERCISE_TYPES) expect(EXERCISES.filter((e) => e.type === type).map((e) => e.id)).toEqual(Array.from({ length: size(type) }, (_, i) => `${type}-${i + 1}`))
    expect(EXERCISES.map((e) => e.type)).toEqual(EXERCISE_TYPES.flatMap((t) => Array(size(t)).fill(t)))
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
      const shown: Card[] = e.situation.rows.flatMap((r) =>
        r.kind === 'trick' ? r.plays.map((p) => p.card) : r.kind === 'history' ? r.tricks.flatMap((t) => t.cards.map((c) => c.card)) : r.kind === 'voids' ? [] : r.cards,
      )
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

  describe('the "Sieg sichern" ladder (SKATGO-108)', () => {
    it('rises: three tricks left at level 1, four at level 2, five at level 3', () => {
      expect(ENDGAMES_STORED.map((s) => [s.hand.length, s.level])).toEqual([
        [3, 1], [3, 1], [3, 1], [4, 2], [4, 2], [4, 2], [4, 2], [5, 3], [5, 3], [5, 3],
      ])
    })
    for (const s of ENDGAMES_STORED) {
      it(`${s.id}: a whole deal, played by the rules`, () => {
        const e = readEndgame(s)
        const played = e.tricks.flatMap((t) => t.cards)
        expect(new Set([...e.hand, ...e.skat, ...e.left, ...e.right, ...played.map((p) => p.card)].map(cardId)).size).toBe(32)
        // Each seat's cards at the start of the play: what it holds now and what it played.
        const hands: Record<string, Card[]> = {
          you: [...e.hand, ...played.filter((p) => p.side === 'you').map((p) => p.card)],
          left: [...e.left, ...played.filter((p) => p.side === 'left').map((p) => p.card)],
          right: [...e.right, ...played.filter((p) => p.side === 'right').map((p) => p.card)],
        }
        for (const h of Object.values(hands)) expect(h).toHaveLength(10)
        let leader = e.tricks[0].cards[0].side
        for (const t of e.tricks) {
          expect(t.cards[0].side).toBe(leader)
          const trick: Card[] = []
          for (const p of t.cards) {
            expect(legalPlays(hands[p.side], trick, e.contract).some((c) => sameCard(c, p.card)), `${s.id} ${p.side} ${cardId(p.card)}`).toBe(true)
            hands[p.side] = hands[p.side].filter((c) => !sameCard(c, p.card))
            trick.push(p.card)
          }
          expect(t.cards[trickWinnerIndex(trick, e.contract)].side).toBe(t.winner)
          leader = t.winner
        }
        expect(leader).toBe('you')
      })
      it(`${s.id}: proven again — one sure card, every other card loses in a possible split, the stored analysis`, () => {
        expect(readEndgame(s)).toEqual(solveEndgame(recordOf(s)))
      })
    }
  })
})
