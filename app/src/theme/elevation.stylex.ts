import * as stylex from '@stylexjs/stylex'

import { color } from './color.stylex'

// Shadows and fills of the lobby design (SKATGO-26). The reference gives every coloured surface a
// shadow in its own colour; each such pairing is named here once.

export const elev = stylex.defineVars({
  tileGreen: `0 5px 16px -6px ${color.tileGreen}`,
  tileOrange: `0 5px 16px -6px ${color.tileOrange}`,
  tileRed: `0 5px 16px -6px ${color.tileRed}`,
  eventCard: '0 5px 16px -6px rgba(93, 109, 125, 0.5)',
  option: '0 5px 16px -6px rgba(0, 0, 0, 0.3)',
  optionFeatured: '0 12px 22px -6px rgba(0, 0, 0, 0.3)',
  panel: '0 5px 8px 2px rgba(24, 30, 37, 0.16)',
  landingHeader: '0 2px 4px 0 rgba(0, 0, 0, 0.075)',
  btnGo: '0 4px 8px 1px rgba(0, 163, 54, 0.2)',
  btnGoLanding: '0 4px 8px 1px rgba(0, 168, 120, 0.2)',
  btnInfo: '0 4px 8px 1px rgba(9, 94, 207, 0.2)',
  btnStop: '0 4px 8px 1px rgba(229, 47, 29, 0.2)',
  btnSlate: '0 4px 8px 1px rgba(62, 76, 93, 0.2)',
  card: '0 2px 6px rgba(0, 0, 0, 0.28)',
  cardRaised: `0 10px 18px rgba(0, 0, 0, 0.28), 0 0 0 3px ${color.gold}`,
  cardGlow: `0 0 0 3px ${color.gold}, 0 0 18px 4px rgba(237, 160, 16, 0.55)`,
  verdictGood: `0 0 0 4px ${color.good}`,
  verdictBad: `0 0 0 4px ${color.bad}`,
  focus: `0 0 0 3px ${color.info}`,
})

export const fill = stylex.defineVars({
  /** The card table and every drill: a radial felt centred on the play (reference.md), under skatgo's
   *  own fine grain — a fractal-noise texture drawn here, so the felt reads as cloth, not a flat fill. */
  felt: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>"), radial-gradient(circle at 50% 50%, ${color.feltInner} 0%, ${color.feltInner} 20%, ${color.feltOuter} 100%)`,
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
  lift: 'translateY(-3px)',
  rest: 'translateY(0)',
  /** An opponent's card, turned on its side inside its landscape slot. */
  sideways: 'translate(-50%, -50%) rotate(90deg)',
  /** Seat plates lying along the frame's left and right edges, and the learner's under its bottom edge. */
  plateLeft: 'translate(-50%, -50%) rotate(-90deg)',
  plateRight: 'translate(50%, -50%) rotate(90deg)',
  plateBottom: 'translate(-50%, 50%)',
  centre: 'translate(-50%, -50%)',
  centreY: 'translateY(-50%)',
  /** The phone's side panel, parked off the right edge until its tab is pulled. */
  offRight: 'translateX(100%)',
  onScreen: 'translateX(0)',
})

/** How much of a tile's colour veils its card art (the reference lays its colour over a photograph). */
export const veil = stylex.defineVars({
  tile: '0.62',
})
