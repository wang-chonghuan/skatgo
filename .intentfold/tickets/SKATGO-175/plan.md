# SKATGO-175 plan

Found in the code: the slogan is the front page's H1 at `typography.landingHero`, used nowhere else, sized by the
`fHero` / `fHeroPhone` tokens (`app/src/theme/type.stylex.ts`): 48px on PC, min(36px, 8.6vw) on a phone (32px at
375). The space above it is the page column's `paddingTop` (32px) in `entry-page.tsx`; the space under it is the
column's gap, which the ticket does not touch.

Route: `fHero` to min(36px, 3.9vw) — the colour cards' titles' size — and `fHeroPhone` to min(26px, 7vw); the column's
`paddingTop` to 16px; ui.md's front-page line says so.
