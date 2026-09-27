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
})
