import * as stylex from '@stylexjs/stylex'

import { skat } from './skat.stylex'

// Depth, texture, movement and timing — every value built from the palette's own names.

export const shadow = stylex.defineVars({
  /** The ledge under a pressable thing: a solid shadow straight down, in a deeper shade. */
  ledgePrimary: `0 3px 0 ${skat.brassDeep}`,
  ledgeQuiet: `0 3px 0 ${skat.paperEdge}`,
  ledgeFelt: `0 3px 0 ${skat.feltDeep}`,
  ledgeBrass: `0 3px 0 ${skat.brass}`,
  ledgeOption: `0 2px 0 ${skat.paperEdge}`,
  /** A tile rising under the pointer. */
  lift: `0 6px 14px ${skat.shadowSoft}`,
  card: `0 2px 6px ${skat.shadow}`,
  cardRaised: `0 10px 18px ${skat.shadow}, 0 0 0 3px ${skat.brass}`,
  cardGlow: `0 0 0 3px ${skat.brass}, 0 0 18px 4px ${skat.glow}`,
  verdictGood: `0 0 0 4px ${skat.good}`,
  verdictBad: `0 0 0 4px ${skat.bad}`,
  badge: `0 1px 3px ${skat.shadow}`,
  launcher: `0 3px 0 ${skat.feltDeep}, 0 8px 20px ${skat.shadowSoft}`,
  /** The assistant window. */
  float: `0 14px 40px ${skat.shadow}`,
  /** The ring inside a drill's felt. */
  feltInset: `inset 0 0 0 3px ${skat.feltDeep}`,
  /** The game table: its ring, and the shadow it casts. */
  table: `inset 0 0 0 3px ${skat.feltDeep}, 0 10px 30px ${skat.shadow}`,
  /** A shape pressed into the felt: lit on its upper-left edge, shadowed on its lower-right. */
  emboss: `-1px -1px 0 ${skat.feltLine}, 2px 2px 0 ${skat.feltDeep}`,
  /** The chat input while it has focus. */
  chatFocus: `0 0 0 3px ${skat.brassSoft}`,
})

export const texture = stylex.defineVars({
  /** Felt lit from where each surface's eye falls. */
  feltHero: `radial-gradient(ellipse at 20% 0%, ${skat.feltLight} 0%, ${skat.felt} 50%, ${skat.feltDeep} 100%)`,
  feltDrill: `radial-gradient(ellipse at 50% 30%, ${skat.feltLight} 0%, ${skat.felt} 60%, ${skat.feltDeep} 100%)`,
  feltTable: `radial-gradient(ellipse at 50% 35%, ${skat.feltLight} 0%, ${skat.felt} 55%, ${skat.feltDeep} 100%)`,
  /** The hatching on a card back. */
  cardBack: `repeating-linear-gradient(45deg, ${skat.shadowSoft} 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, ${skat.shadowSoft} 0 4px, transparent 4px 8px)`,
  /** A card that cannot be played now. */
  dimmed: 'brightness(0.62) saturate(0.7)',
})

/** Where a thing sits as it rests, is pressed, or rises. */
export const move = stylex.defineVars({
  rest: 'translateY(0)',
  press: 'translateY(2px)',
  lift: 'translateY(-2px)',
  cardHover: 'translateY(-6px)',
  cardRaised: 'translateY(-16px)',
  /** The stars on the finish screen. */
  starsBig: 'scale(2)',
})

/** CSS transition timing. JS animation timing lives in constants.ts. */
export const timing = stylex.defineVars({
  press: '120ms',
  tile: '140ms',
  card: '160ms',
  progress: '400ms',
  easeOut: 'ease-out',
})
