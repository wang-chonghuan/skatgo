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
  /** One turn of the logo while a table loads (SKATGO-93), at an even pace. */
  spin: '2.4s',
  steady: 'linear',
  /** The gold cup on the League tile (SKATGO-221, the human: 「还会闪的」): one pass of the light band — over the cup for
   *  about a third of it, out of sight the rest — and one dim-to-lit swing of a sparkle beside it, the second sparkle
   *  half a swing behind the first. */
  shine: '3.2s',
  twinkle: '1.6s',
  twinkleBehind: '-0.8s',
  easeInOut: 'ease-in-out',
})

/** The gold cup's light band (SKATGO-221): from left of the cup to far past its right, in the cup's own 24-unit drawing
 *  (a CSS px is one of its units). The path is longer than the cup is wide, so an even pass crosses the cup for about a
 *  third of `timing.shine` and rests out of sight the rest — a pause without keyframe stops. Clipped to the cup. */
export const shine = stylex.defineConsts({
  start: 'translateX(0)',
  end: 'translateX(60px)',
})

/** A sparkle beside the gold cup, dim and small, then lit and whole (SKATGO-221). */
export const twinkle = stylex.defineConsts({
  dim: '0.25',
  lit: '1',
  small: 'scale(0.55)',
  whole: 'scale(1)',
})

/** One whole turn, start to end: the logo while a table loads (SKATGO-93, the human: 「最好让它会旋转，因为本来就是个
 *  三叉的形状」). The keyframes are where it turns; StyleX keeps them with the styles that use them. */
export const turn = stylex.defineConsts({
  start: 'rotate(0deg)',
  end: 'rotate(360deg)',
})


/** A compositing hint for things that move over the felt (SKATGO-41): each gets its own layer, so the
 *  browser moves a finished bitmap instead of painting the felt again under it, every frame. */
export const layerHint = stylex.defineConsts({
  moving: 'transform',
})
