// The printables (SKATGO-53): each downloadable PDF, and the page it is printed from. Plain data, so the
// Vite config can read it too: it gives every PDF a canonical Link header naming its page, which keeps
// search engines on the page (the human's choice, SKATGO-53). app/scripts/make-printables.mjs writes the
// files.

export const PRINTABLES = {
  scoreSheet: { route: '/rules/score-sheet', pdf: { de: '/downloads/skatliste.pdf', en: '/downloads/skat-score-sheet.pdf' } },
  summary: { route: '/rules/printable', pdf: { de: '/downloads/skatregeln.pdf', en: '/downloads/skat-rules.pdf' } },
} as const

export type Printable = keyof typeof PRINTABLES
