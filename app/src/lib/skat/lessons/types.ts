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

/** Tap cards that are worth exactly `target` card points together — any `size` cards that add up are right. */
export type SumStep = {
  kind: 'sum'
  prompt: string
  cards: Card[]
  size: number
  target: number
  explain: string
  hint: string
}

/**
 * The learner deals the shuffled deck as a real table does (lesson 1): packets of 3 to each player
 * clockwise from the dealer's left, 2 to the skat, then 4 each, then 3 each. The learner is the dealer
 * and gets their own packet last; `cards` is the deck from the top.
 */
export type DealStep = {
  kind: 'deal'
  prompt: string
  cards: Card[]
  explain: string
}

/**
 * An auction at a real table (lesson 7): the learner holds `hand` and would play `contract`; the other
 * two seats, Lina and Noah, go as far as their `limits` (0: pass at once). The learner's own limit is
 * the engine's value of that game; every call of theirs is judged against it.
 */
export type BidStep = {
  kind: 'bid'
  prompt: string
  hand: Card[]
  contract: Contract
  /** The learner's seat. */
  seat: 'forehand' | 'middlehand' | 'rearhand'
  /** How high the two others go, in seat order after the learner: [the next seat, the one after]. */
  limits: [number, number]
  explain: string
}

/** A whole game against the computers; the step is solved when a game reaches its settlement. */
export type GameStep = { kind: 'game'; title: string; body: string[] }

/** A drill built fresh each time from random cards. Must only be called in the browser. */
export type GeneratedStep = { kind: 'generated'; make: () => Exclude<Step, GeneratedStep> }

export type Step = TeachStep | ChoiceStep | PickStep | OrderStep | PlayStep | SumStep | DealStep | BidStep | GameStep | GeneratedStep

export type Lesson = {
  id: string
  title: string
  /** One line for the course map: what you can do after this lesson. */
  promise: string
  /** What the learner can do now, said on the lesson's done screen after "You can now:". */
  learned: string
  minutes: number
  steps: Step[]
}
