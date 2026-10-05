import * as stylex from '@stylexjs/stylex'

// Movement and timing. Shadows and fills live in elevation.stylex.ts (SKATGO-26).

/** Where a thing sits as it rests, is pressed, or rises. */
export const move = stylex.defineVars({
  rest: 'translateY(0)',
  press: 'translateY(2px)',
  cardHover: 'translateY(-6px)',
  cardRaised: 'translateY(-16px)',
  /** The stars on the finish screen. */
  starsBig: 'scale(2)',
  /** A card at rest in the trick, on a layer of its own (SKATGO-41). Unlike a will-change hint, the
   *  browser draws it at its final size, as sharp as a card with no layer. */
  ownLayer: 'translateZ(0)',
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

/** A compositing hint for things that move over the felt (SKATGO-41): each gets its own layer, so the
 *  browser moves a finished bitmap instead of painting the felt again under it, every frame. */
export const layerHint = stylex.defineConsts({
  moving: 'transform',
})
