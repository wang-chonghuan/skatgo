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
  /** The suit pressed into an entry-page card. */
  watermark: { fontSize: fontSize.f200, lineHeight: leading.glyph },

  // The lobby design (SKATGO-26). Sizes and weights are the reference's (reference.md); a phone size
  // the reference did not show is derived from the same ratio.

  // The public site
  landingTitle: { fontSize: { default: fontSize.f72, [bp.phone]: fontSize.f36 }, fontWeight: weight.black, lineHeight: leading.tight },
  /** The front page's H1 and its lead (SKATGO-29): Funbridge's hero sizes, measured on funbridge.com —
   *  headline 72/36 black, subheading 28/24 bold, both at 1.2.
   *  Both restate the family: the Astryx theme sets its own on every h1 and p, which the page does not load. */
  landingHero: { fontFamily: family.body, fontSize: { default: fontSize.f72, [bp.phone]: fontSize.f36 }, fontWeight: weight.black, lineHeight: leading.tight },
  landingHeroLead: { fontFamily: family.body, fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f24 }, fontWeight: weight.bold, lineHeight: leading.tight },
  landingLead: { fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f24 }, fontWeight: weight.bold, lineHeight: leading.tight },
  /** The site's name beside the mark in the front page header (SKATGO-31): the hero headline's face and weight. */
  landingBrand: { fontFamily: family.body, fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f24 }, fontWeight: weight.black, lineHeight: leading.tight },
  landingHeading: { fontSize: { default: fontSize.f36, [bp.phone]: fontSize.f24 }, fontWeight: weight.extrabold, lineHeight: leading.tight },
  landingBody: { fontSize: { default: fontSize.f20, [bp.phone]: fontSize.f16 }, fontWeight: weight.medium, lineHeight: leading.ui },
  landingNav: { fontSize: fontSize.f16, fontWeight: weight.medium, lineHeight: leading.ui },
  landingBtn: { fontFamily: 'inherit', fontSize: fontSize.f20, fontWeight: weight.bold, lineHeight: leading.ui },
  landingCta: { fontFamily: 'inherit', fontSize: fontSize.f22, fontWeight: weight.bold, lineHeight: leading.ui },
  landingStat: { fontSize: { default: fontSize.f40, [bp.phone]: fontSize.f28 }, fontWeight: weight.black, lineHeight: leading.tight },

  // The app
  appText: { fontSize: fontSize.f16, fontWeight: weight.regular, lineHeight: leading.ui },
  appBtn: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.regular, lineHeight: leading.ui },
  appBtnStrong: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.bold, lineHeight: leading.ui },
  sectionTitle: { fontSize: fontSize.f20_46, fontWeight: weight.black, lineHeight: leading.tight, textTransform: 'uppercase' },
  railLabel: { fontSize: fontSize.f14, fontWeight: weight.bold, lineHeight: leading.ui },
  greeting: { fontSize: fontSize.f16, fontWeight: weight.regular, lineHeight: leading.ui },
  greetingName: { fontSize: fontSize.f16, fontWeight: weight.bold, lineHeight: leading.ui },
  tileTitle: { fontSize: { default: fontSize.f25, [bp.phone]: fontSize.f22 }, fontWeight: weight.medium, lineHeight: leading.tight },
  tileSub: { fontSize: { default: fontSize.f18_18, [bp.phone]: fontSize.f15 }, fontWeight: weight.bold, lineHeight: leading.tight },
  countBadge: { fontSize: fontSize.f16, fontWeight: weight.bold, lineHeight: leading.glyph },
  bandTitle: { fontSize: { default: fontSize.f30, [bp.phone]: fontSize.f22 }, fontWeight: weight.bold, lineHeight: leading.ui },
  bandBack: { fontSize: fontSize.f16, fontWeight: weight.regular, lineHeight: leading.glyph },
  optionTitle: { fontSize: { default: fontSize.f26_95, [bp.phone]: fontSize.f20 }, fontWeight: weight.bold, lineHeight: leading.ui },
  optionDesc: { fontSize: { default: fontSize.f19_6, [bp.phone]: fontSize.f15 }, fontWeight: weight.bold, lineHeight: leading.tight },
  dialogTitle: { fontSize: fontSize.f22, fontWeight: weight.bold, lineHeight: leading.tight },

  // The card table
  plateName: { fontSize: fontSize.f14, fontWeight: weight.regular, lineHeight: leading.tight },
  roleTag: { fontSize: fontSize.f16, fontWeight: weight.semibold, lineHeight: leading.glyph },
  tricksLabel: { fontSize: fontSize.f14_21, fontWeight: weight.regular, lineHeight: leading.tight },
  tableStatus: { fontSize: fontSize.f14, fontWeight: weight.semibold, lineHeight: leading.tight },
  auctionHead: { fontSize: fontSize.f21_45, fontWeight: weight.regular, lineHeight: leading.tight },
  panelLabel: { fontSize: fontSize.f14, fontWeight: weight.bold, lineHeight: leading.ui },
  bidNumeral: { fontFamily: family.numeral, fontSize: fontSize.f32, fontWeight: weight.regular, lineHeight: leading.glyph },
  bidChip: { fontFamily: family.numeral, fontSize: fontSize.f20, fontWeight: weight.regular, lineHeight: leading.glyph },
  contractTile: { fontFamily: 'inherit', fontSize: fontSize.f18, fontWeight: weight.bold, lineHeight: leading.tight },
  // The table's info board: a small caps label over a large value, and a quieter second line.
  infoLabel: { fontSize: fontSize.f12, fontWeight: weight.bold, lineHeight: leading.tight, textTransform: 'uppercase', letterSpacing: '0.06em' },
  infoValue: { fontSize: { default: fontSize.f22, [bp.phone]: fontSize.f18 }, fontWeight: weight.bold, lineHeight: leading.tight },
  infoNumber: { fontFamily: family.numeral, fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f24 }, fontWeight: weight.regular, lineHeight: leading.glyph },
  infoSub: { fontSize: fontSize.f13, fontWeight: weight.medium, lineHeight: leading.tight },
})
