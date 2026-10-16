import type { Card } from '../../cards'
import type { Endgame } from './endgame'
import { ENDGAMES } from './ladder'
import type { ExerciseText } from './types'

// The ladder's words (SKATGO-108), one template per language filled from each puzzle's proven facts — so a
// thousand puzzles read as well as ten, and no sentence says more than the solver showed.

type Lang = {
  game: Record<'C' | 'S' | 'H' | 'D' | 'G', string>
  suit: Record<'C' | 'S' | 'H' | 'D', string>
  side: Record<'left' | 'right', string>
  rank: Partial<Record<Card['rank'], string>>
  title: (game: string, left: number, need: number | null) => string
  prompt: (level: number) => string
  noSuit: (side: string, trick: number, suit: string) => string
  noTrump: (side: string, trick: number) => string
  placed: (left: string, right: string) => string
  only: (card: string, need: number, have: number, level: number) => string
}

const SYMBOL = { C: '♣', S: '♠', H: '♥', D: '♦' } as const

function words(l: Lang, e: Endgame): ExerciseText {
  const card = (c: Card) => `${SYMBOL[c.suit]}${l.rank[c.rank] ?? c.rank}`
  const list = (cs: Card[]) => cs.map(card).join(' ')
  const facts = e.voids.map((v) => (v.suit === 'T' ? l.noTrump(l.side[v.side], v.trick) : l.noSuit(l.side[v.side], v.trick, l.suit[v.suit])))
  if (e.placed.left.length || e.placed.right.length) facts.push(l.placed(list(e.placed.left), list(e.placed.right)))
  facts.push(l.only(card(e.answer), e.need, e.have, e.level))
  const game = e.contract.kind === 'grand' ? l.game.G : l.game[e.contract.kind === 'suit' ? e.contract.trump : 'G']
  return { title: l.title(game, e.hand.length, e.level < 3 ? e.need : null), prompt: l.prompt(e.level), explain: facts.join(' ') }
}

const DE: Lang = {
  game: { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo', G: 'Grand' },
  suit: { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo' },
  side: { left: 'Der linke Gegner', right: 'Der rechte Gegner' },
  rank: { J: 'B', Q: 'D' },
  title: (game, left, need) => (need === null ? `${game}: noch ${left} Stiche` : `${game}: noch ${left} Stiche, ${need} Augen fehlen`),
  prompt: (level) =>
    level < 3
      ? 'Welche Karte gewinnt sicher – egal, wie die Karten der Gegner sitzen?'
      : 'Zähl selbst, wie viele Augen dir fehlen. Welche Karte gewinnt dann sicher – egal, wie die Karten der Gegner sitzen?',
  noSuit: (side, trick, suit) => `${side} hat in Stich ${trick} kein ${suit} bedient.`,
  noTrump: (side, trick) => `${side} hat in Stich ${trick} keinen Trumpf zugegeben.`,
  placed: (left, right) =>
    `Also sitzen ${[left ? `${left} sicher links` : '', right ? `${right} sicher rechts` : ''].filter(Boolean).join(', ')}.`,
  only: (card, need, have, level) =>
    `${level === 3 ? `Du hast ${have} Augen, es fehlen ${need}. ` : ''}Nur mit **${card}** holst du die fehlenden ${need} Augen, wie auch immer die übrigen Karten sitzen.`,
}

const EN: Lang = {
  game: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds', G: 'Grand' },
  suit: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' },
  side: { left: 'The left opponent', right: 'The right opponent' },
  rank: { J: 'J', Q: 'Q' },
  title: (game, left, need) => (need === null ? `${game}: ${left} tricks to go` : `${game}: ${left} tricks to go, ${need} card points short`),
  prompt: (level) =>
    level < 3
      ? 'Which card wins for sure – however the opponents\' cards lie?'
      : 'Count for yourself how many card points you are short. Which card then wins for sure – however the opponents\' cards lie?',
  noSuit: (side, trick, suit) => `${side} did not follow ${suit} in trick ${trick}.`,
  noTrump: (side, trick) => `${side} had no trump in trick ${trick}.`,
  placed: (left, right) => `So ${[left ? `${left} must be on the left` : '', right ? `${right} must be on the right` : ''].filter(Boolean).join(', and ')}.`,
  only: (card, need, have, level) =>
    `${level === 3 ? `You have ${have} card points, ${need} short. ` : ''}Only **${card}** brings the ${need} you need, however the other cards lie.`,
}

export const LADDER_DE: Record<string, ExerciseText> = Object.fromEntries(ENDGAMES.map((e) => [e.id, words(DE, e)]))
export const LADDER_EN: Record<string, ExerciseText> = Object.fromEntries(ENDGAMES.map((e) => [e.id, words(EN, e)]))
