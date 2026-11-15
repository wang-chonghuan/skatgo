# SKATGO-200 plan

What the code already says: the header (`LandingHeader`, `components/skat/frame.tsx`) puts the mark and the name
"SkatGo" on the left and the flags, the gear and sign-in on the right; under `bp.narrowPhone` (≤359px) the name hides
and the right-hand gaps close a little (SKATGO-104/105/144). Measured on production: German overflows at 360–429px
(36px at 360), English at 360px (8px), because "Anmelden" is longer than "Sign in".

Route: a breakpoint `bp.markOnly` (`@media (max-width: 429px)`) in `theme/breakpoints.stylex.ts`; `brandName` hides under
it instead of `narrowPhone`. Gaps, flags, gear, button and header height untouched. ui.md's header line follows.
