import * as stylex from '@stylexjs/stylex'

// Typography primitives. Product code never uses these directly: it picks a complete role from
// `type.ts`, which is where family, size, weight and leading are combined.

export const family = stylex.defineVars({
  body: '"DM Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  /** The course's display serif, for the two big titles. */
  display: '"Fraunces", "Songti SC", "Noto Serif SC", serif',
  /** The heading stack the Astryx theme gives `h*` (parrottoonTheme.ts): Fraunces, CJK in a sans. It
   *  is written out rather than read from `--font-family-heading`, which is not defined where these
   *  variables are. */
  heading: 'Fraunces, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", Georgia, serif',
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
  f200: '200px',
})

/** Only the weights the page loads (routes/__root.tsx): 400, 600, 700. */
export const weight = stylex.defineVars({
  regular: '400',
  semibold: '600',
  bold: '700',
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
})
