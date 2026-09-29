import * as stylex from '@stylexjs/stylex'

// The palette of the lobby design (SKATGO-26). Values were measured from the reference in
// .intentfold/tickets/SKATGO-26/reference.md; a value marked "derived" was not visible in the
// reference and follows the system's own principles instead. Product code names these; it never
// writes a colour (check-design-tokens.mjs).
//
// One light palette: the app is a light grey page with white surfaces, and the card table is a dark
// felt at any hour.
export const color = stylex.defineVars({
  // Surfaces
  page: '#F2F4F7',
  surface: '#FFFFFF',
  hairline: '#E0E5EB',
  footer: '#364460',

  // Text
  text: '#29323D',
  navy: '#022657',
  slate: '#5D6D7D',
  slateDeep: '#3E4C5D',
  onColor: '#FFFFFF',

  // Actions
  go: '#00A336',
  goLanding: '#00A878',
  info: '#095ECF',
  stop: '#E52F1D',

  // Section tiles
  tileGreen: '#00821A',
  tileOrange: '#E56F00',
  tileIndigo: '#332AB0',
  tileTeal: '#077794',
  /** A section that is not open yet: the slate, not a colour of its own (derived). */
  tileSoon: '#5D6D7D',

  // The card table
  feltInner: '#085435',
  feltOuter: '#053320',
  gold: '#EDA010',
  amber: '#FF9E10',
  plate: '#252525',
  /** skatgo's card back: charcoal (derived). */
  cardBack: '#34373C',
  cardBackLight: '#4A4E55',
  /** The hint tab on the felt's edge. */
  hintTab: 'rgba(37, 37, 37, 0.85)',
  /** The info board over the felt, and its dividers (derived). */
  board: 'rgba(0, 0, 0, 0.32)',
  boardLine: 'rgba(255, 255, 255, 0.14)',
  onColorSoft: 'rgba(255, 255, 255, 0.72)',
  roleTag: '#007A28',
  auctionHead: '#639B3D',
  /** The active tab tile in the side panel (derived from the action green). */
  tabActive: '#6FDDA2',

  // Judging an answer — derived from the action green and red.
  good: '#00A336',
  goodSoft: '#E3F6EA',
  bad: '#E52F1D',
  badSoft: '#FDE7E4',

  /** ♥ and ♦ in text. */
  suitRed: '#D6281B',

  // Contract tints, one per game, from the reference's bid-box tints (Grand and Null derived).
  tintClubs: '#DDE3EA',
  tintSpades: '#C9CFD6',
  tintHearts: '#FAD4D6',
  tintDiamonds: '#FCDDB8',
  tintGrand: '#CFE3FA',
  tintNull: '#E4DBF7',

  // Overlays
  scrim: 'rgba(0, 0, 0, 0.5)',
  topBar: 'rgba(249, 250, 251, 0.2)',
  tileVeil: 'rgba(0, 0, 0, 0.2)',
})
