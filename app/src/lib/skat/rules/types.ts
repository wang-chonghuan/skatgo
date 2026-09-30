// The rules reference (SKATGO-29): the /rules page, and the per-lesson landing text that links into it.
// Text follows the course's two conventions (**bold**, coloured suit symbols; see ui.tsx `Rich`).
// Numbers a reader could check against the game — base values, Null values, the bidding ladder — are
// never typed here: the page renders them from the rules engine (value.ts), so the reference cannot
// disagree with the game.

/** The eight sections of the rules page, in order. */
export type RuleSectionId = 'cards' | 'dealing' | 'bidding' | 'games' | 'extras' | 'value' | 'scoring' | 'house'

/** A table the page builds from the engine rather than from typed numbers. */
export type EngineTable = 'baseValues' | 'nullValues' | 'biddingLadder' | 'cardPoints'

export type RuleBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'example'; title: string; lines: string[] }
  | { kind: 'engine'; table: EngineTable }

export type RuleSection = {
  id: RuleSectionId
  /** The section's anchor in this language, lowercase ASCII with hyphens: `#bidding`, `#reizen`. */
  anchor: string
  title: string
  blocks: RuleBlock[]
  /** The lesson (id) that teaches this section; the section ends with a link to it. */
  lesson: string
}

export type RulesText = {
  /** One or two paragraphs under the H1. */
  intro: string[]
  sections: RuleSection[]
}

/** A lesson's landing text: what crawlers and first-time visitors read before the interactive part. */
export type LessonGuide = {
  /** The lesson's address in this language, lowercase ASCII with hyphens: `how-bidding-works`. */
  slug: string
  /** Question-style title for <title> (before " – Skat Lesson {n} | SkatGo"). */
  question: string
  /** The page's H1. */
  h1: string
  /** Meta description, 120–160 characters. */
  description: string
  /** 100–200 words in 2–3 paragraphs explaining the lesson's concept. */
  intro: string[]
  /** The rules section this lesson links to at the end of the page. */
  rule: RuleSectionId
}
