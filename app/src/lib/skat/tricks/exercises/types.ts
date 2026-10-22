import type { Card, Contract } from '../../cards'
import type { Endgame } from './endgame'
import type { OpenEndgame } from './open'

// The Skat-Tricks exercises (SKATGO-103): twelve kinds of question, three of each, chosen by hand. A
// position is language-free (positions.ts); its words are per language (text.{de,en}.ts). Every answer is
// either worked out by the rules engine and the exact solver (solve.ts) when the exercise is built, or
// SkatZero's judgement — then multiplayer/test/tricks-exercises.test.ts asks SkatZero again and holds the
// answer to beating the second choice by a margin.

export const EXERCISE_TYPES = [
  // The open-card endgames (SKATGO-110), shown first, as levels (SKATGO-111).
  'offenes-endspiel',
  // The ladder (SKATGO-108) comes first: Skat's mate-in-N, closed cards, 30 steps of four tricks (SKATGO-110).
  'sieg-sichern',
  'reizen',
  'druecken',
  'spielwahl',
  'anspielen',
  'schmieren',
  'mitzaehlen',
  'verlierbar',
  'endspiel',
  'null-ouvert',
  'null-risiko',
  'wahrscheinlichkeit',
  'ausspielen',
] as const
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

export type Position3 = 'forehand' | 'middlehand' | 'rearhand'
/** Who a card or a hand belongs to, as the learner sees the table. */
export type Who = 'you' | 'partner' | 'declarer' | 'left' | 'right'

/** A row of cards shown with the question: the skat, a trick already played, another seat's open hand. */
export type ShownRow =
  | { kind: 'skat'; cards: Card[] }
  | { kind: 'trick'; n: number; plays: { who: Who; card: Card }[] }
  | { kind: 'hand'; who: Who; cards: Card[] }
  | { kind: 'outstanding'; cards: Card[] }
  | { kind: 'hand12'; cards: Card[] }


/** What the learner is told of the game before the question, all of it language-free. */
export type Situation = {
  /** The game being played, if one is. */
  contract?: Contract
  hand?: boolean
  ouvert?: boolean
  /** The trick being played, counted from 1, when the game is under way. */
  trickNo?: number
  /** The learner's part in it, and seat. */
  role: 'bidder' | 'declarer' | 'defender'
  position?: Position3
  /** The declarer's seat when the learner defends. */
  declarer?: Position3
  bid?: number
  /** Card points the learner's side holds so far. */
  points?: number
  rows: ShownRow[]
}

export type Option =
  | { kind: 'number'; n: number }
  | { kind: 'percent'; p: number }
  | { kind: 'game'; game: Game }
  /** An option whose words are the exercise's own (`text.options[i]`). */
  | { kind: 'text' }

export type Ask =
  | { kind: 'choice'; options: Option[]; answer: number }
  /** Tap the cards that answer (all of `correct`, nothing else). */
  | { kind: 'pick'; cards: Card[]; correct: Card[] }
  /** Play a card: `best` are the right ones. */
  | { kind: 'play'; contract: Contract; hand: Card[]; trick: { who: Who; card: Card }[]; best: Card[] }

/** A game after the skat is taken, as SkatZero names it. */
export type Game = 'C' | 'S' | 'H' | 'D' | 'G' | 'N' | 'NO'

/**
 * What SkatZero is asked to judge an exercise by (multiplayer/test/tricks-exercises.test.ts). Seats are the
 * declarer's frame (0 the declarer, 1 and 2 the defenders in play order); `position` is 0 forehand, 1
 * middlehand, 2 rearhand.
 */
export type Judge =
  /** A card to play, from everything played so far. */
  | { kind: 'card'; me: 0 | 1 | 2; trace: [0 | 1 | 2, Card][]; skat: Card[]; points: [number, number]; handGame: boolean }
  /** Two cards to put away for `game`. */
  | { kind: 'discard'; game: Game; position: 0 | 1 | 2 }
  /** The game to play after picking up, at `bid`. */
  | { kind: 'game'; position: 0 | 1 | 2; bid: number }
  /** Whether to say `bid` or pass, from ten cards. */
  | { kind: 'bid'; position: 0 | 1 | 2; bid: number }

/** How an answer was established — shown in the ticket's handoff, and re-checked by the tests. */
export type Proof =
  | { by: 'engine'; note: string }
  | { by: 'solver'; note: string }
  | { by: 'skatzero'; judge: Judge }

export type Exercise = {
  id: string
  type: ExerciseType
  /** The Skat trick it practises: its number in the article. */
  trick?: number
  situation: Situation
  ask: Ask
  proof: Proof
  /** A ladder step's proven facts (SKATGO-108): the table it is set on and the line shown after the answer. */
  endgame?: Endgame
  /** An open-card endgame's table and worked-out play (SKATGO-110). */
  open?: OpenEndgame
}

/** One exercise's words in one language. */
export type ExerciseText = {
  /** A one-line title, for the list and the page's heading. */
  title: string
  prompt: string
  /** The words of `{ kind: 'text' }` options, in order. */
  options?: string[]
  /** Why the answer is right — shown once the question is answered. */
  explain: string
  /** A ladder step's most tempting wrong card and why it fails (SKATGO-109). */
  trap?: string
}

/** A kind of question's words: its name and one line of what it trains. */
export type TypeText = { title: string; blurb: string }

export type ExercisesText = {
  types: Record<ExerciseType, TypeText>
  exercises: Record<string, ExerciseText>
}
