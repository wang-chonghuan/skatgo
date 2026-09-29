import * as stylex from '@stylexjs/stylex'

import { color } from './color.stylex'

// Shadows and fills of the lobby design (SKATGO-26). The reference gives every coloured surface a
// shadow in its own colour; each such pairing is named here once.

export const elev = stylex.defineVars({
  tileGreen: `0 5px 16px -6px ${color.tileGreen}`,
  tileOrange: `0 5px 16px -6px ${color.tileOrange}`,
  tileIndigo: `0 5px 16px -6px ${color.tileIndigo}`,
  tileTeal: `0 5px 16px -6px ${color.tileTeal}`,
  tileSoon: `0 5px 16px -6px ${color.tileSoon}`,
  eventCard: '0 5px 16px -6px rgba(93, 109, 125, 0.5)',
  option: '0 5px 16px -6px rgba(0, 0, 0, 0.3)',
  optionFeatured: '0 12px 22px -6px rgba(0, 0, 0, 0.3)',
  panel: '0 5px 8px 2px rgba(24, 30, 37, 0.16)',
  landingHeader: '0 2px 4px 0 rgba(0, 0, 0, 0.075)',
  band: '0 8px 16px 0 rgba(229, 111, 0, 0.192)',
  btnGo: '0 4px 8px 1px rgba(0, 163, 54, 0.2)',
  btnGoLanding: '0 4px 8px 1px rgba(0, 168, 120, 0.2)',
  btnInfo: '0 4px 8px 1px rgba(9, 94, 207, 0.2)',
  btnStop: '0 4px 8px 1px rgba(229, 47, 29, 0.2)',
  btnSlate: '0 4px 8px 1px rgba(62, 76, 93, 0.2)',
  btnUndo: '0 4px 8px 1px rgba(93, 109, 125, 0.2)',
  card: '0 2px 6px rgba(0, 0, 0, 0.28)',
  cardRaised: `0 10px 18px rgba(0, 0, 0, 0.28), 0 0 0 3px ${color.gold}`,
  cardGlow: `0 0 0 3px ${color.gold}, 0 0 18px 4px rgba(237, 160, 16, 0.55)`,
  verdictGood: `0 0 0 4px ${color.good}`,
  verdictBad: `0 0 0 4px ${color.bad}`,
  focus: `0 0 0 3px ${color.info}`,
  none: 'none',
})

export const fill = stylex.defineVars({
  /** The card table and every drill: a radial felt centred on the play. */
  felt: `radial-gradient(circle at 50% 50%, ${color.feltInner} 0%, ${color.feltInner} 20%, ${color.feltOuter} 100%)`,
  /** The veil a tile's colour lays over its artwork. */
  tileVeil: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.22) 100%)',
  /** A card back: skatgo's own lattice, in the table's gold on navy (derived, original). */
  cardBack: `repeating-linear-gradient(45deg, rgba(237, 160, 16, 0.35) 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, rgba(237, 160, 16, 0.35) 0 2px, transparent 2px 7px), linear-gradient(${color.navy}, ${color.navy})`,
  dimmed: 'brightness(0.62) saturate(0.7)',
  /** A coloured button under the pointer. */
  hoverBright: 'brightness(1.06)',
})

/** Poses of skatgo's own card art: the tiles' corner fan and the front page's hero fan (original
 *  compositions of the public-domain deck, SKATGO-26). */
export const pose = stylex.defineVars({
  fanFarLeft: 'rotate(-24deg) translate(-8px, 26px)',
  fanLeft: 'rotate(-12deg) translate(-4px, 8px)',
  fanMid: 'rotate(0deg)',
  fanRight: 'rotate(12deg) translate(4px, 8px)',
  fanFarRight: 'rotate(24deg) translate(8px, 26px)',
  tileArt: 'rotate(-8deg)',
  cardHover: 'translateY(-6px)',
  lift: 'translateY(-3px)',
  rest: 'translateY(0)',
  flip: 'rotate(180deg)',
})

/** How much of a tile's colour veils its card art (the reference lays its colour over a photograph). */
export const veil = stylex.defineVars({
  tile: '0.62',
  soon: '0.78',
})
