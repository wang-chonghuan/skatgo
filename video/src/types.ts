import type { Card } from '~/lib/skat/cards'

/** One spoken line: its text, the scene it belongs to, its audio and length (filled in by scripts/make.mjs). */
export type Segment = { id: string; text: string; scene: string; audio?: string; frames?: number }

export type Trick = { winner: number; cards: { who: string; seat: number; card: Card }[] }

/** What one video shows and says (scripts/plan.ts). */
export type Plan = {
  kind: 'quiz' | 'answer'
  day: string
  date: string
  role: string
  hand: Card[]
  question?: { key: string; text: string }
  skat?: Card[]
  discard?: Card[]
  declarer?: string | null
  contract?: string | null
  bid?: number
  won?: boolean | null
  points?: { declarer: number; defenders: number; value: number } | null
  tricks?: Trick[]
  segments: Segment[]
}

export const FPS = 30
/** The pause after the quiz's question, to think (with a countdown). */
export const THINK = 3 * FPS
/** A breath between lines. */
export const GAP = 8
/** The answer's tricks need time to be seen, one after another. */
export const TRICK = 24
