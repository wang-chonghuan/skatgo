import * as stylex from '@stylexjs/stylex'

import { bp } from './breakpoints.stylex'
import { family, fontSize, leading, weight } from './type.stylex'

// The course's typography roles. A role is the whole decision — family, size (and its phone size),
// weight and leading — so product code picks one and never sets a font property itself
// (check-design-tokens.mjs). A role without `lineHeight` keeps the leading it sits in (the theme's
// prose default on `p` and `h*`, the frame's elsewhere); giving it one would move text that is right.
// Colour is not part of a role: the surface decides it (ui.md).
export const typography = stylex.create({
  /** The frame's family, which everything inside inherits. */
  frame: { fontFamily: family.body },

  // Titles
  hero: { fontFamily: family.display, fontSize: { default: fontSize.f36, [bp.phone]: fontSize.f28 }, fontWeight: weight.bold, lineHeight: leading.tight },
  stepTitle: { fontFamily: family.display, fontSize: { default: fontSize.f26, [bp.phone]: fontSize.f22 }, fontWeight: weight.bold, lineHeight: leading.tight },
  finishTitle: { fontFamily: family.heading, fontSize: fontSize.f28, fontWeight: weight.bold },
  pageTitle: { fontFamily: family.heading, fontSize: fontSize.f24, fontWeight: weight.bold },
  resultTitle: { fontFamily: family.heading, fontSize: fontSize.f20, fontWeight: weight.bold },
  brand: { fontSize: fontSize.f17, fontWeight: weight.bold },
  cardTitle: { fontSize: fontSize.f17, fontWeight: weight.bold },

  // Text
  prompt: { fontSize: { default: fontSize.f19, [bp.phone]: fontSize.f17 }, fontWeight: weight.semibold, lineHeight: leading.compact },
  body: { fontSize: fontSize.f16, lineHeight: leading.reading },
  bodySmall: { fontSize: fontSize.f15, lineHeight: leading.reading },
  say: { fontSize: fontSize.f15, lineHeight: leading.compact },
  note: { fontSize: fontSize.f14, lineHeight: leading.compact },
  context: { fontSize: fontSize.f14 },
  loading: { fontSize: fontSize.f16 },
  emphasis: { fontWeight: weight.bold },

  // Names and labels
  contract: { fontSize: fontSize.f16, fontWeight: weight.bold },
  name: { fontSize: fontSize.f15, fontWeight: weight.bold },
  windowName: { fontSize: fontSize.f15, fontWeight: weight.bold, lineHeight: leading.tight },
  bid: { fontSize: fontSize.f14, fontWeight: weight.bold },
  link: { fontSize: fontSize.f14, fontWeight: weight.semibold },
  small: { fontSize: fontSize.f13 },
  meta: { fontSize: fontSize.f13, fontWeight: weight.semibold },
  smallBold: { fontSize: fontSize.f13, fontWeight: weight.bold },
  switch: { fontSize: fontSize.f13, fontWeight: weight.bold, lineHeight: leading.tight },
  label: { fontSize: fontSize.f12, fontWeight: weight.bold },
  pill: { fontSize: fontSize.f12, fontWeight: weight.bold, lineHeight: leading.control },
  micro: { fontSize: fontSize.f12 },
  windowSub: { fontSize: fontSize.f12, lineHeight: leading.tight },
  /** A ✓ / ✗ under a card: the caption's weight at reading size. */
  verdictMark: { fontSize: fontSize.f16 },

  // Controls — native controls do not inherit the family, so every control role restates it.
  control: { fontFamily: 'inherit' },
  controlSm: { fontFamily: 'inherit', fontSize: fontSize.f13, fontWeight: weight.bold },
  controlMd: { fontFamily: 'inherit', fontSize: fontSize.f15, fontWeight: weight.bold },
  controlLg: { fontFamily: 'inherit', fontSize: fontSize.f17, fontWeight: weight.bold },
  option: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.semibold, lineHeight: leading.control },
  toggle: { fontFamily: 'inherit', fontSize: fontSize.f13, fontWeight: weight.semibold },
  badge: { fontSize: fontSize.f13, fontWeight: weight.bold },

  // Glyphs sized as pictures
  stars: { fontSize: fontSize.f16, lineHeight: leading.glyph },
  closeGlyph: { fontSize: fontSize.f18, fontWeight: weight.bold },
  markGlyph: { fontSize: fontSize.f20 },
  seatFace: { fontSize: fontSize.f26, lineHeight: leading.glyph },
  emojiTile: { fontSize: fontSize.f28 },
  celebrate: { fontSize: fontSize.f88, lineHeight: leading.glyph },
})
