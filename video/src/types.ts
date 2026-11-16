import type { Card } from '~/lib/skat/cards'

/** One spoken line: its text, the scene it belongs to, its audio and length (filled in by scripts/make.mjs). */
export type Segment = { id: string; text: string; scene: string; part?: 'answer' | 'quiz'; style?: string; trick?: number; pause?: boolean; audio?: string; frames?: number }

export type Trick = { winner: number; cards: { who: string; seat: number; card: Card }[] }

/** What one video shows and says (scripts/plan.ts). */
export type Plan = {
  kind: 'quiz' | 'answer'
  lang: 'de' | 'en'
  day: string
  date: string
  role: string
  hand: Card[]
  question?: { key: string; text: string }
  skat?: Card[]
  discard?: Card[]
  declarer?: string | null
  /** The player's seat declared. */
  mine?: boolean
  contract?: string | null
  bid?: number
  won?: boolean | null
  points?: { declarer: number; defenders: number; value: number } | null
  tricks?: Trick[]
  lesson?: string
  segments: Segment[]
}

/** A day's one video: yesterday's deal played out, then today's as the question (the lines of both, in order). */
export type Day = { lang: 'de' | 'en'; day: string; today: Plan; yesterday: Plan; segments: Segment[] }

export const FPS = 30
/** The pause after the quiz's question, to think (with a countdown). */
export const THINK = 3 * FPS
/** A breath between lines. */
export const GAP = 8
/** The pause after "how would you play it?" (the human: 「暂停视频思考一下，1秒后」). */
export const PAUSE = FPS
