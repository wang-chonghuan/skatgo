import * as stylex from '@stylexjs/stylex'

// The palette of the lobby design (SKATGO-26). Values were measured from the reference in
// .intentfold/tickets/SKATGO-26/reference.md; a value marked "derived" was not visible in the
// reference and follows the system's own principles instead. Product code names these; it never
// writes a colour (check-design-tokens.mjs).
//
// Two palettes in one (SKATGO-184, the human: 「需要夜间模式，因为夜间太刺眼……实现精美的夜间模式」): a value that
// differs at night is `light-dark(<day>, <night>)`, and the page's `color-scheme` picks — the device's own, or the one
// chosen in the settings (lib/appearance.ts). By day the app is a light grey page with white surfaces; at night a dark
// page tinted with the brand's navy, the cards and panels one step lighter, body text a soft grey and titles near white
// — never pure black or pure white (measured at Lichess and Chess.com; Funbridge has no night mode). What has one value
// is the same day and night: the action colours, the section tiles, the card table (a dark felt at any hour) and the
// playing cards.
// A browser without `light-dark()` (Safari before 17.5) keeps the day values and has no night mode, rather than losing
// the colours; the settings then offer no choice (lib/appearance.ts).
const NIGHT = '@supports (color: light-dark(#000, #fff))'

export const color = stylex.defineVars({
  // Surfaces
  page: { default: '#F2F4F7', [NIGHT]: 'light-dark(#F2F4F7, #10161E)' },
  surface: { default: '#FFFFFF', [NIGHT]: 'light-dark(#FFFFFF, #19212B)' },
  hairline: { default: '#E0E5EB', [NIGHT]: 'light-dark(#E0E5EB, #2C3744)' },

  // Text
  text: { default: '#29323D', [NIGHT]: 'light-dark(#29323D, #CDD5DE)' },
  navy: { default: '#022657', [NIGHT]: 'light-dark(#022657, #EAF0F7)' },
  slate: { default: '#5D6D7D', [NIGHT]: 'light-dark(#5D6D7D, #95A3B3)' },
  /** A darker slate: the slate button's fill and the quieter line on a contract's tint, the same day and night. */
  slateDeep: '#3E4C5D',
  /** A darker slate as text on a surface (SKATGO-184: `slateDeep`'s text uses, split off so it can lighten at night):
   *  the side panel's tabs, a card row's caption. */
  slateStrong: { default: '#3E4C5D', [NIGHT]: 'light-dark(#3E4C5D, #B6C2CF)' },
  onColor: '#FFFFFF',

  // Actions
  go: '#00A336',
  goLanding: '#00A878',
  info: { default: '#095ECF', [NIGHT]: 'light-dark(#095ECF, #3C8FE8)' },
  stop: '#E52F1D',

  // Section tiles
  tileGreen: '#00821A',
  tileOrange: '#E56F00',
  /** Skat with friends (SKATGO-61): a step deeper than `stop`, as the green tile is than `go`.
   *  Approved by the human, 2026-10-08. */
  tileRed: '#C8281A',
  /** The tricks tile (SKATGO-82; until then practice, coming soon, SKATGO-69): the slogan's navy (`navy`),
   *  the human's choice, 2026-10-09. */
  tileNavy: { default: '#022657', [NIGHT]: 'light-dark(#022657, #1A4383)' },

  // The card table
  /** A playing card's face and the frame around its back: white, as a real card, day and night (SKATGO-184). */
  cardFace: '#FFFFFF',
  /** The court frame's hairline on a card face (SKATGO-184: the light `slate`, kept at night). */
  cardLine: '#5D6D7D',
  /** The outline of the hand that asks for a tap (SKATGO-184: the light `navy`, kept at night). */
  tapLine: '#022657',
  feltInner: '#085435',
  feltOuter: '#053320',
  gold: '#EDA010',
  amber: '#FF9E10',
  plate: '#252525',
  /** The hint tab on the felt's edge. */
  hintTab: 'rgba(37, 37, 37, 0.85)',
  /** The info board over the felt, and its dividers (derived). */
  board: 'rgba(0, 0, 0, 0.32)',
  boardLine: 'rgba(255, 255, 255, 0.14)',
  onColorSoft: 'rgba(255, 255, 255, 0.72)',
  roleTag: '#007A28',
  /** The hand that asks for a tap to collect the trick (SKATGO-72); its outline is `navy`. The human
   *  asked for a skin-coloured hand, 2026-10-10. */
  tapSkin: '#F6C4A0',
  auctionHead: '#639B3D',
  /** The active tab tile in the side panel (derived from the action green). */
  tabActive: '#6FDDA2',

  // Judging an answer — derived from the action green and red.
  good: { default: '#00A336', [NIGHT]: 'light-dark(#00A336, #1DB456)' },
  goodSoft: { default: '#E3F6EA', [NIGHT]: 'light-dark(#E3F6EA, #173527)' },
  bad: { default: '#E52F1D', [NIGHT]: 'light-dark(#E52F1D, #FF6352)' },
  badSoft: { default: '#FDE7E4', [NIGHT]: 'light-dark(#FDE7E4, #3E211F)' },

  // Contract tints, one per game, from the reference's bid-box tints (Grand and Null derived).
  tintClubs: '#DDE3EA',
  tintSpades: '#C9CFD6',
  tintHearts: '#FAD4D6',
  tintDiamonds: '#FCDDB8',
  tintGrand: '#CFE3FA',
  tintNull: '#E4DBF7',

  // The share buttons' platform marks, each its brand's own colour (SKATGO-132, from Simple Icons).
  whatsapp: '#25D366',
  facebook: '#0866FF',
  telegram: '#26A5E4',
  xBrand: { default: '#000000', [NIGHT]: 'light-dark(#000000, #FFFFFF)' },

  // Overlays
  /** A card's edge at night (SKATGO-184): a lighter hairline around a card or panel, which a shadow alone cannot lift off a
   *  dark page. None by day, where the shadow does it. */
  edge: { default: 'transparent', [NIGHT]: 'light-dark(transparent, #2B3643)' },
  /** What a picture with a white ground is multiplied with (SKATGO-184): white by day, so it shows as drawn; a soft
   *  grey at night, so its white ground does not glare from a dark page. */
  imageDim: { default: '#FFFFFF', [NIGHT]: 'light-dark(#FFFFFF, #B4BCC6)' },
  scrim: { default: 'rgba(0, 0, 0, 0.5)', [NIGHT]: 'light-dark(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.66))' },
})
