import type { Card, Contract } from '../cards'

// A lesson is a list of steps. Teaching steps show; every other kind asks, and is judged by the
// rules engine rather than by an answer key typed in beside it — so a drill cannot disagree with
// the game the learner plays at the end.
//
// Text is plain strings with two conventions the renderer understands: **bold**, and the four suit
// symbols, which it colours.

export type CardRow = {
  label?: string
  cards: Card[]
  /** One caption under each card, same order. */
  captions?: string[]
  faceDown?: boolean
  /**
   * The row is a hand answering `lead` in `contract`: each card is captioned ✓ (may be played) or ✗
   * by the rules engine, never by hand — so a picture cannot teach a follow rule the game contradicts.
   */
  follow?: { contract: Contract; lead: Card }
}

export type TeachStep = {
  kind: 'teach'
  title: string
  body: string[]
  rows?: CardRow[]
  /** A boxed aside: the thing to remember, or the classic beginner's mistake. */
  tip?: string
}

export type ChoiceStep = {
  kind: 'choice'
  prompt: string
  rows?: CardRow[]
  options: string[]
  answer: number
  /** Shown once the right option is chosen. */
  explain: string
  /** Shown on a wrong pick; falls back to a generic nudge. */
  hint?: string
}

/** Tap every card that fits (or the one card, when `single`). */
export type PickStep = {
  kind: 'pick'
  prompt: string
  context?: string
  cards: Card[]
  correct: Card[]
  single?: boolean
  explain: string
  hint?: string
}

/** Tap the cards from strongest to weakest. */
export type OrderStep = {
  kind: 'order'
  prompt: string
  context?: string
  cards: Card[]
  /** The right order, strongest first. */
  correct: Card[]
  explain: string
  /** The ordering rule in one line, shown after a wrong tap. */
  hint: string
}

/** A hand, a trick in progress, a contract: play a card. Illegal cards are refused with the reason. */
export type PlayStep = {
  kind: 'play'
  prompt: string
  contract: Contract
  hand: Card[]
  trick: Card[]
  /** Who played the cards already on the table, for the labels. */
  trickBy?: string[]
  /** When given, a legal card that is not one of these is sent back with `whyNot`. */
  best?: Card[]
  whyNot?: string
  explain: string
}

/** A whole game against the computers; the step is solved when a game reaches its settlement. */
export type GameStep = { kind: 'game'; title: string; body: string[] }

/** A drill built fresh each time from random cards. Must only be called in the browser. */
export type GeneratedStep = { kind: 'generated'; make: () => Exclude<Step, GeneratedStep> }

export type Step = TeachStep | ChoiceStep | PickStep | OrderStep | PlayStep | GameStep | GeneratedStep

export type Lesson = {
  id: string
  title: string
  /** One line for the course map: what you can do after this lesson. */
  promise: string
  emoji: string
  minutes: number
  steps: Step[]
}
