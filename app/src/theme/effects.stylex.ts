import * as stylex from '@stylexjs/stylex'

// Movement and timing. Shadows and fills live in elevation.stylex.ts (SKATGO-26).

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
  /** Every transition under `bp.reducedMotion` (SKATGO-29). */
  instant: '0s',
  easeOut: 'ease-out',
})
