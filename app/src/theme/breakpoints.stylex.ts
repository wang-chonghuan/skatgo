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
  /** The card table's stage in portrait (SKATGO-34, theme/table.stylex.ts): a phone held upright, or a
   *  felt taller than wide. */
  portrait: '@media (orientation: portrait)',
  /** Wide enough for the table's side panel to stay open beside the felt (SKATGO-34, as Funbridge's
   *  does), so it takes its share of the width and the table scales to the rest. The same width, as a
   *  query string for `matchMedia`, is `pinnedQuery` in `constants.ts`; change both together. */
  pinned: '@media (min-width: 900px)',
  /** The visitor asked for less motion (SKATGO-29): transitions become instant. Animations follow the
   *  same setting through motion's `MotionConfig reducedMotion="user"`. */
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
})
