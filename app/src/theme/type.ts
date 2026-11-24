import * as stylex from '@stylexjs/stylex'

import { bp } from './breakpoints.stylex'
import { family, fontSize, leading, tracking, weight } from './type.stylex'

// The course's typography roles. A role is the whole decision — family, size (and its phone size),
// weight and leading — so product code picks one and never sets a font property itself
// (check-design-tokens.mjs). A role without `lineHeight` keeps the leading it sits in (the theme's
// prose default on `p` and `h*`, the frame's elsewhere); giving it one would move text that is right.
// Colour is not part of a role: the surface decides it (ui.md).
// Every text role states its weight (SKATGO-47): the Astryx theme sets <p> and <small> to 400 itself, so
// a weight the role leaves out is 400, not the frame's. Reading text is `weight.text`, controls, links,
// labels and meta `weight.ui`; titles and emphasis keep their own.
export const typography = stylex.create({
  /** The frame's family, which everything inside inherits. */
  frame: { fontFamily: family.body, fontWeight: weight.text },

  // Text
  prompt: { fontSize: { default: fontSize.f19, [bp.phone]: fontSize.f17 }, fontWeight: weight.ui, lineHeight: leading.compact },
  body: { fontSize: fontSize.f16, fontWeight: weight.text, lineHeight: leading.reading },
  bodySmall: { fontSize: fontSize.f15, fontWeight: weight.text, lineHeight: leading.reading },
  note: { fontSize: fontSize.f14, fontWeight: weight.text, lineHeight: leading.compact },
  context: { fontSize: fontSize.f14, fontWeight: weight.text },
  loading: { fontSize: fontSize.f16, fontWeight: weight.text },
  emphasis: { fontWeight: weight.bold },

  // Names and labels
  link: { fontSize: fontSize.f14, fontWeight: weight.ui },
  small: { fontSize: fontSize.f13, fontWeight: weight.ui },
  meta: { fontSize: fontSize.f13, fontWeight: weight.ui },
  smallBold: { fontSize: fontSize.f13, fontWeight: weight.bold },
  label: { fontSize: fontSize.f12, fontWeight: weight.bold },
  micro: { fontSize: fontSize.f12, fontWeight: weight.ui },
  /** A ✓ / ✗ under a card: the caption's weight at reading size. */
  verdictMark: { fontSize: fontSize.f16 },

  // Controls — native controls do not inherit the family, so every control role restates it.
  control: { fontFamily: 'inherit' },
  option: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.ui, lineHeight: leading.control },
  toggle: { fontFamily: 'inherit', fontSize: fontSize.f13, fontWeight: weight.ui },
  badge: { fontSize: fontSize.f13, fontWeight: weight.bold },
  /** The "Hot" ribbon across the League tile's corner: a badge's weight, a step larger (SKATGO-221, the human:
   *  「彩带上的Hot字体稍微大一点」; the 13px `badge` until then). */
  ribbon: { fontSize: fontSize.f16, fontWeight: weight.bold },

  // Glyphs sized as pictures
  stars: { fontSize: fontSize.f16, lineHeight: leading.glyph },

  // The lobby design (SKATGO-26). Sizes and weights are the reference's (reference.md); a phone size
  // the reference did not show is derived from the same ratio.

  // The public site
  /** The front page's H1 and its lead (SKATGO-29): the headline is Funbridge's hero size, measured on
   *  funbridge.com — 72/36 black at 1.2. The lead was its subheading, 28/24 bold, until it crowded the
   *  headline and the button; now it is smaller, 22/18, and stays bold so it does not fade (SKATGO-91, the human:
   *  「字太多，字号太大」, then 「太短太淡了」 and 「字重不够，有点淡」).
   *  Both restate the family: the Astryx theme sets its own on every h1 and p, which the page does not load. */
  landingHeroLead: { fontFamily: family.body, fontSize: { default: fontSize.f22, [bp.phone]: fontSize.f18 }, fontWeight: weight.bold, lineHeight: leading.ui },
  /** The site's name beside the mark in the front page header (SKATGO-31): the hero headline's face and weight. */
  landingBrand: { fontFamily: family.body, fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f24 }, fontWeight: weight.black, lineHeight: leading.tight },
  landingHeading: { fontSize: { default: fontSize.f36, [bp.phone]: fontSize.f24 }, fontWeight: weight.extrabold, lineHeight: leading.tight },
  landingBody: { fontSize: { default: fontSize.f20, [bp.phone]: fontSize.f16 }, fontWeight: weight.text, lineHeight: leading.ui },
  landingNav: { fontSize: fontSize.f16, fontWeight: weight.ui, lineHeight: leading.ui },
  landingBtn: { fontFamily: 'inherit', fontSize: fontSize.f20, fontWeight: weight.bold, lineHeight: leading.ui },
  landingCta: { fontFamily: 'inherit', fontSize: fontSize.f22, fontWeight: weight.bold, lineHeight: leading.ui },

  // The app
  appText: { fontSize: fontSize.f16, fontWeight: weight.text, lineHeight: leading.ui },
  appBtn: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.ui, lineHeight: leading.ui },
  /** A link or menu item set as text — the rules' contents, the language menu (SKATGO-47). It restates
   *  the family because a menu item is a native control. */
  appLink: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.ui, lineHeight: leading.ui },
  appBtnStrong: { fontFamily: 'inherit', fontSize: fontSize.f16, fontWeight: weight.bold, lineHeight: leading.ui },
  tileTitle: { fontSize: { default: fontSize.f25, [bp.phone]: fontSize.f22 }, fontWeight: weight.ui, lineHeight: leading.tight },
  /** A front-page card's title (SKATGO-135, the human's picture: 「卡片上的字，应该用这种尺寸和粗的字」): large and bold. */
  homeCardTitle: { fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f22 }, fontWeight: weight.bold, lineHeight: leading.tight },
  /** …and the four colour cards' titles, larger still (the human: 「四个卡片上的字还是太小」). */
  homeTileTitle: { fontSize: { default: fontSize.f36, [bp.phone]: fontSize.f28 }, fontWeight: weight.bold, lineHeight: leading.tight },
  tileSub: { fontSize: { default: fontSize.f18_18, [bp.phone]: fontSize.f15 }, fontWeight: weight.bold, lineHeight: leading.tight },
  optionTitle: { fontSize: { default: fontSize.f26_95, [bp.phone]: fontSize.f20 }, fontWeight: weight.bold, lineHeight: leading.ui },
  optionDesc: { fontSize: { default: fontSize.f19_6, [bp.phone]: fontSize.f15 }, fontWeight: weight.bold, lineHeight: leading.tight },
  dialogTitle: { fontSize: fontSize.f22, fontWeight: weight.bold, lineHeight: leading.tight },

  // The card table
  /** The side panel's tab labels (Game, Course, Settings). */
  tabLabel: { fontSize: fontSize.f14, fontWeight: weight.bold, lineHeight: leading.ui },
  plateName: { fontSize: fontSize.f14, fontWeight: weight.ui, lineHeight: leading.tight },
  roleTag: { fontSize: fontSize.f16, fontWeight: weight.ui, lineHeight: leading.glyph },
  tricksLabel: { fontSize: fontSize.f14_21, fontWeight: weight.ui, lineHeight: leading.tight },
  auctionHead: { fontSize: fontSize.f21_45, fontWeight: weight.ui, lineHeight: leading.tight },
  panelLabel: { fontSize: fontSize.f14, fontWeight: weight.bold, lineHeight: leading.ui },
  bidChip: { fontFamily: family.numeral, fontSize: fontSize.f20, fontWeight: weight.regular, lineHeight: leading.glyph },
  contractTile: { fontFamily: 'inherit', fontSize: fontSize.f18, fontWeight: weight.bold, lineHeight: leading.tight },
  // The table's info board: a small caps label over a large value, and a quieter second line.
  infoLabel: { fontSize: fontSize.f12, fontWeight: weight.bold, lineHeight: leading.tight, textTransform: 'uppercase', letterSpacing: { default: '0.06em', [bp.phone]: '0.02em' } },
  infoValue: { fontSize: { default: fontSize.f22, [bp.phone]: fontSize.f18 }, fontWeight: weight.bold, lineHeight: leading.tight },
  infoNumber: { fontFamily: family.numeral, fontSize: { default: fontSize.f28, [bp.phone]: fontSize.f24 }, fontWeight: weight.regular, lineHeight: leading.glyph },
  /** The three running totals in one cell of the info board (SKATGO-100): smaller with the phone's width. */
  infoTotal: { fontFamily: family.numeral, fontSize: { default: fontSize.f28, [bp.phone]: fontSize.fBoardTotal }, fontWeight: weight.regular, lineHeight: leading.glyph },
  /** …when one of them has four digits, all three smaller, so they still fit. */
  infoTotalLong: { fontFamily: family.numeral, fontSize: { default: fontSize.f22, [bp.phone]: fontSize.fBoardTotalLong }, fontWeight: weight.regular, lineHeight: leading.glyph },
  infoSub: { fontSize: fontSize.f13, fontWeight: weight.ui, lineHeight: leading.tight },

  // The forum (SKATGO-231): Geist's roles as the Vercel Community sets them (theme/geist.stylex.ts). The family is set
  // once on the forum (`forumFrame`); every role inside states its size, weight and line height.
  forumFrame: { fontFamily: family.geist, fontWeight: weight.regular },
  /** The forum's h1: 32 on 40, semibold, drawn tighter. */
  forumDisplay: { fontSize: { default: fontSize.f32, [bp.phone]: fontSize.f24 }, fontWeight: weight.semibold, lineHeight: { default: leading.g40, [bp.phone]: leading.g32 }, letterSpacing: { default: tracking.display, [bp.phone]: tracking.title } },
  /** A post's title on its page: 24 on 32, semibold. */
  forumTitle: { fontSize: fontSize.f24, fontWeight: weight.semibold, lineHeight: leading.g32, letterSpacing: tracking.title },
  /** A block's heading ("Discussion", "Videos"): 18 on 28, medium. */
  forumHeading: { fontSize: fontSize.f18, fontWeight: weight.medium, lineHeight: leading.g28 },
  /** A featured or video card's title: 18, semibold. */
  forumCardTitle: { fontSize: fontSize.f18, fontWeight: weight.semibold, lineHeight: leading.g24 },
  /** A row's title: 16 on 24, medium. */
  forumRowTitle: { fontSize: fontSize.f16, fontWeight: weight.medium, lineHeight: leading.g24 },
  /** Reading text, excerpts, dates and the navigation: 14 on 20. */
  forumText: { fontSize: fontSize.f14, fontWeight: weight.regular, lineHeight: leading.g20 },
  /** A name, a button: 14 on 20, medium. Restates the family: a button is a native control. */
  forumName: { fontFamily: 'inherit', fontSize: fontSize.f14, fontWeight: weight.medium, lineHeight: leading.g20 },
  /** A pill: 14 on 16. */
  forumPill: { fontFamily: 'inherit', fontSize: fontSize.f14, fontWeight: weight.regular, lineHeight: leading.g16 },
  /** A row's newest comment, an avatar's letter on a small avatar: 12 on 16. */
  forumSmall: { fontSize: fontSize.f12, fontWeight: weight.regular, lineHeight: leading.g16 },
  /** A heading inside a post's text. */
  forumBodyHeading: { fontSize: fontSize.f18, fontWeight: weight.semibold, lineHeight: leading.g28 },
  /** Bold inside a post's text. */
  forumStrong: { fontWeight: weight.semibold },
})
