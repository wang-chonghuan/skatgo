import * as stylex from '@stylexjs/stylex'

// Typography primitives. Product code never uses these directly: it picks a complete role from
// `type.ts`, which is where family, size, weight and leading are combined.

// SKATGO-26: one geometric sans for everything, as the lobby design has it. The reference's typeface
// (nexa) is commercial; Red Hat Display (Google Fonts, open licence) is the free face closest to it in
// width, weight and letterforms, set side by side with Funbridge's own (SKATGO-29, replacing Outfit,
// which read rounder and narrower). Bebas Neue (open licence) sets Reizen values and "Passe". CJK falls
// back to the system's sans.
const SANS = '"Red Hat Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'

export const family = stylex.defineVars({
  body: SANS,
  /** The forum's face (SKATGO-231): Vercel's Geist, as its community forum sets everything (theme/geist.stylex.ts). */
  geist: '"Geist", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  /** Condensed numerals for Reizen values and "Passe". */
  numeral: '"Bebas Neue", "Red Hat Display", sans-serif',
})

/** Font sizes, named by their size in px. */
export const fontSize = stylex.defineVars({
  f12: '12px',
  f13: '13px',
  f14: '14px',
  f15: '15px',
  f16: '16px',
  f17: '17px',
  f18: '18px',
  f19: '19px',
  f20: '20px',
  f22: '22px',
  f24: '24px',
  f28: '28px',
  /** The forum's heading (SKATGO-231, Geist's 32). */
  f32: '32px',
  f36: '36px',
  // The lobby design's measured sizes (SKATGO-26, reference.md).
  f14_21: '14.21px',
  f18_18: '18.18px',
  f19_6: '19.6px',
  f21_45: '21.45px',
  f25: '25px',
  f26_95: '26.95px',
  f72: '72px',
  /** The table's three running totals on a phone (SKATGO-100): they share one cell of the info board, so they
   *  shrink with the screen rather than run past it. */
  fBoardTotal: 'min(24px, 5.2vw)',
  /** …and when one of them has four digits. */
  fBoardTotalLong: 'min(18px, 4.2vw)',
})

/** Only the weights the page loads (routes/__root.tsx): 400 to 900. */
export const weight = stylex.defineVars({
  /** Reading text: paragraphs, explanations, leads, table rows (SKATGO-47: 400 read too faint; SKATGO-148, the human:
   *  「整个的字体，都太细了……加粗」: 500 too, one step up). */
  text: '600',
  /** Controls, navigation, links, labels and meta: buttons, pills, the table's names and small lines
   *  (SKATGO-47). One step above reading text, below the 800 of titles and emphasis (SKATGO-148). */
  ui: '700',
  regular: '400',
  /** Geist's medium and semibold, the forum's names, row titles, buttons and titles (SKATGO-231). */
  medium: '500',
  semibold: '600',
  bold: '800',
  extrabold: '900',
  black: '900',
})

export const leading = stylex.defineVars({
  /** Emoji and glyphs sized as pictures. */
  glyph: '1',
  /** Titles and compact labels. */
  tight: '1.2',
  /** Controls and pills. */
  control: '1.4',
  /** Compact text: prompts, notes, the table's running line, chat bubbles. */
  compact: '1.6',
  /** Reading text. */
  reading: '1.75',
  /** The lobby design's text leading: 24 on 16, 21 on 14, 45 on 30. */
  ui: '1.5',
  // Geist's line heights, as the forum measures them (SKATGO-231): fixed in px, as Geist sets them.
  g16: '16px',
  g20: '20px',
  g24: '24px',
  g28: '28px',
  g32: '32px',
  g40: '40px',
})

/** Letter spacing: Geist draws its large headings tighter (SKATGO-231, measured at 32 and 24). */
export const tracking = stylex.defineVars({
  display: '-1.28px',
  title: '-0.96px',
})
