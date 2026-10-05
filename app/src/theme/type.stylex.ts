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
  /** Once the course's display serif; the lobby design has a single family. */
  display: SANS,
  /** The heading stack, the same single family. */
  heading: SANS,
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
  f26: '26px',
  f28: '28px',
  f36: '36px',
  f88: '88px',
  // The lobby design's measured sizes (SKATGO-26, reference.md).
  f11_37: '11.37px',
  f14_21: '14.21px',
  f18_18: '18.18px',
  f19_6: '19.6px',
  f20_46: '20.46px',
  f21_45: '21.45px',
  f25: '25px',
  f26_95: '26.95px',
  f30: '30px',
  f32: '32px',
  f40: '40px',
  f72: '72px',
  f200: '200px',
})

/** Only the weights the page loads (routes/__root.tsx): 400 to 900. */
export const weight = stylex.defineVars({
  /** Reading text: paragraphs, explanations, leads, table rows (SKATGO-47: 400 read too faint). */
  text: '500',
  /** Controls, navigation, links, labels and meta: buttons, pills, the table's names and small lines
   *  (SKATGO-47). One step above reading text, below the 700 of titles and emphasis. */
  ui: '600',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
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
})
