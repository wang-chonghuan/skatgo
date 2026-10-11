// The Skat-Tricks section (SKATGO-82): strategy articles in plain words, the first of them — twelve tricks —
// at the section's own address. Text follows the course's two conventions (**bold**, coloured suit
// symbols; see ui.tsx `Rich`). A number a reader could check against the game — a base value, a card's
// points — is taken from the rules engine (value.ts, cards.ts), never typed.

/** A page of the site an article links to. */
export type TricksLink = { to: '/rules' | '/rules/bidding-table' | '/course'; label: string }

export type TricksBlock =
  | { kind: 'h2'; title: string }
  /** One trick: its number, its title, a few short paragraphs, and perhaps a page to read on. */
  | { kind: 'trick'; n: number; title: string; paragraphs: string[]; link?: TricksLink }
  /** A way to the daily tournament: a line of text and its button. */
  | { kind: 'cta'; text: string; button: string }

export type TricksArticle = {
  metaTitle: string
  metaDescription: string
  h1: string
  /** The paragraphs under the H1. */
  intro: string[]
  blocks: TricksBlock[]
  /** The pages to read on, at the end. */
  further: { title: string; links: TricksLink[] }
}
