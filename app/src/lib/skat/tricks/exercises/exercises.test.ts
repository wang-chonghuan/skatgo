import { describe, expect, it } from 'vitest'

import { type Card, cardId, fullDeck, legalPlays, pointsOf as cardPoints, sameCard, trickWinnerIndex } from '../../cards'
import { locales } from '~/paraglide/runtime'
import { EXERCISE_TEXT, EXERCISE_TYPES, EXERCISES, SHOWN_TYPES, exerciseById } from '.'
import { ENDGAMES_STORED } from './endgames.data'
import { readEndgame, recordOf, solveEndgame } from './endgame'
import { type OpenNode, readOpen, recordOfOpen, solveOpen } from './open'
import { OPEN_STORED } from './open-endgames.data'
import { collectTrick, playCard, type Game } from '../../game'
import { MITZAEHLEN, cards } from './positions'

// The Skat-Tricks exercises (SKATGO-103) held to their ticket: the "Sieg sichern" ladder of 30 (SKATGO-108,
// SKATGO-109) first, then twelve kinds of three, every one in both languages, every card real and every move legal. The exact answers are computed when positions.ts loads —
// a position whose answer is not unique fails there; SkatZero's are checked in multiplayer/.

describe('the Skat-Tricks exercises', () => {
  it('the open-card endgames first (SKATGO-110), then the ladder of 30, then twelve kinds of three, in the kinds\' order, each id once', () => {
    const size = (type: string) => (type === 'offenes-endspiel' ? 20 : type === 'sieg-sichern' ? 30 : 3)
    expect(EXERCISE_TYPES[0]).toBe('offenes-endspiel')
    expect(EXERCISE_TYPES).toHaveLength(14)
    expect(EXERCISES).toHaveLength(86)
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(86)
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

  describe('the "Sieg sichern" ladder (SKATGO-108)', () => {
    it('30 steps of one standard: four tricks left (SKATGO-110)', () => {
      expect(ENDGAMES_STORED.map((s) => s.hand.length)).toEqual(Array(30).fill(4))
    })
    it('every step has its tip and its trap in both languages', () => {
      for (const locale of locales) for (const s of ENDGAMES_STORED) expect(EXERCISE_TEXT[locale].exercises[s.id].trap, `${locale} ${s.id}`).toBeTruthy()
    })
    // The tips and traps are written by hand (SKATGO-109): every card they name is still in play, in the letters
    // of the text's language; the tip names the answer in bold, and the trap starts with a card that loses.
    const RANKS: Record<string, Record<string, Card['rank']>> = {
      de: { '7': '7', '8': '8', '9': '9', '10': '10', B: 'J', D: 'Q', K: 'K', A: 'A' },
      en: { '7': '7', '8': '8', '9': '9', '10': '10', J: 'J', Q: 'Q', K: 'K', A: 'A' },
    }
    const SUITS: Record<string, Card['suit']> = { '♣': 'C', '♠': 'S', '♥': 'H', '♦': 'D' }
    for (const locale of locales) {
      it(`${locale}: the cards each tip and trap name`, () => {
        const named = (text: string) =>
          [...text.matchAll(/([♣♠♥♦])(10|[0-9]|[A-Z])/g)].map(([whole, suit, rank]) => {
            expect(RANKS[locale][rank], `${whole} is not a ${locale} card`).toBeTruthy()
            return { suit: SUITS[suit], rank: RANKS[locale][rank] } as Card
          })
        const label = (c: Card) => `${Object.keys(SUITS).find((g) => SUITS[g] === c.suit)}${Object.keys(RANKS[locale]).find((r) => RANKS[locale][r] === c.rank)}`
        for (const s of ENDGAMES_STORED) {
          const e = readEndgame(s)
          const w = EXERCISE_TEXT[locale].exercises[s.id]
          const live = [...e.hand, ...e.left, ...e.right]
          for (const c of [...named(w.explain), ...named(w.trap ?? '')]) expect(live.some((d) => sameCard(c, d)), `${s.id}: ${cardId(c)} is not in play`).toBe(true)
          expect(w.explain, s.id).toContain(`**${label(e.answer)}**`)
          const first = named(w.trap ?? '')[0]
          expect(first && e.traps.some((t) => sameCard(t.card, first)), `${s.id}: the trap starts with a card that loses`).toBe(true)
        }
      })
    }
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
      it(`${s.id}: the sure way shown after the answer brings the points still needed`, () => {
        const e = readEndgame(s)
        expect(e.line.filter((t) => t.winner === 'you').reduce((n, t) => n + t.points, 0)).toBeGreaterThanOrEqual(e.need)
      })
      it(`${s.id}: proven again — one sure card, every other card loses in a possible split, the stored analysis`, () => {
        expect(readEndgame(s)).toEqual(solveEndgame(recordOf(s)))
      })
    }
  })

  describe('the open-card endgames (SKATGO-110)', () => {
    it('are the only exercises shown; the others are hidden, not deleted', () => {
      expect(SHOWN_TYPES).toEqual(['offenes-endspiel'])
      expect(exerciseById('offenes-endspiel-1')).toBeTruthy()
      for (const e of EXERCISES.filter((x) => x.type !== 'offenes-endspiel')) expect(exerciseById(e.id), e.id).toBeUndefined()
    })
    it('twenty, three to five tricks to go, declarer and defender both', () => {
      const all = OPEN_STORED.map(readOpen)
      expect(all).toHaveLength(20)
      for (const e of all) expect([3, 4, 5]).toContain(e.game.hands[0].length)
      expect(new Set(all.map((e) => e.role))).toEqual(new Set(['declarer', 'defender']))
    })
    for (const s of OPEN_STORED) {
      it(`${s.id}: proven again — one card wins at the start, the stored play as worked out`, () => {
        expect(readOpen(s)).toEqual(solveOpen(recordOfOpen(s)))
        expect(readOpen(s).play.win).toHaveLength(1)
      })
      it(`${s.id}: every way through the play is legal and ends won`, () => {
        const e = readOpen(s)
        const won = (g: Game) => {
          const declarer = g.declarer!
          const have = cardPoints(g.skat) + g.tricks.filter((t) => t.winner === declarer).reduce((n, t) => n + cardPoints(t.cards.map((p) => p.card)), 0)
          const left = cardPoints([...g.hands.flat(), ...g.trick.map((p) => p.card)])
          return e.role === 'declarer' ? have >= 61 : have + left < 61
        }
        const apply = (g: Game, card: Card) => {
          const at = g.phase === 'trickEnd' ? collectTrick(g) : g
          const next = playCard(at, card)
          expect(next, `${s.id}: ${cardId(card)}`).not.toBe(at)
          return next.phase === 'trickEnd' ? collectTrick(next) : next
        }
        const walk = (g: Game, n: OpenNode) => {
          expect(n.win.length, s.id).toBeGreaterThan(0)
          for (const a of n.after) {
            let at = apply(g, a.card)
            for (const p of a.plays) at = apply(at, p.card)
            if (a.next) walk(at, a.next)
            else expect(won(at), `${s.id}: decided for the learner after ${cardId(a.card)}`).toBe(true)
          }
        }
        walk(e.game, e.play)
      })
    }
  })
})
