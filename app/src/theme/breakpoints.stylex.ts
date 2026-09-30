import * as stylex from '@stylexjs/stylex'

// The course's breakpoints, as media-query keys for `stylex.create` (`[bp.phone]: …`). Constants, not
// variables: a media query cannot read a CSS variable. The same phone width, as a query string for
// `matchMedia`, is `phoneQuery` in `constants.ts`; change both together.
export const bp = stylex.defineConsts({
  /** The phone step, used throughout. */
  phone: '@media (max-width: 480px)',
  /** The contract picker wraps from six columns to three. */
  contracts: '@media (max-width: 600px)',
  /** The course map's hero stacks. */
  hero: '@media (max-width: 720px)',
  /** Too narrow for two columns of option cards beside the rail (SKATGO-26). */
  cards: '@media (max-width: 1023px)',
  /** Between the phone and the desk, exclusive of the phone step: a style that sets both this and
   *  `phone` must not depend on which query is emitted last (SKATGO-26). */
  mid: '@media (min-width: 481px) and (max-width: 720px)',
  /** The visitor asked for less motion (SKATGO-29): transitions become instant. Animations follow the
   *  same setting through motion's `MotionConfig reducedMotion="user"`. */
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
})
