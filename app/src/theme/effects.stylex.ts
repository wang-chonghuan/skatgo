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
})

/** One whole turn, start to end: the logo while a table loads (SKATGO-93, the human: 「最好让它会旋转，因为本来就是个
 *  三叉的形状」). The keyframes are where it turns; StyleX keeps them with the styles that use them. */
export const turn = stylex.defineConsts({
  start: 'rotate(0deg)',
  end: 'rotate(360deg)',
  /** The logo turns about the centre of its three outer suits, not of its picture: measured in
   *  icon-192.png (logo-mark.png has the same framing), the circle through the suits' centres has its centre at 49.6% across and 57.7% down
   *  (the human: 「旋转的中心不对」). */
  origin: '49.6% 57.7%',
  /** …and is lifted by the difference, so that centre sits in the middle of its disc. */
  lift: '0.4% -7.7%',
})

/** A compositing hint for things that move over the felt (SKATGO-41): each gets its own layer, so the
 *  browser moves a finished bitmap instead of painting the felt again under it, every frame. */
export const layerHint = stylex.defineConsts({
  moving: 'transform',
})
