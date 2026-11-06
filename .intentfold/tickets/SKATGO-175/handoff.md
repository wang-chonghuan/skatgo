# SKATGO-175 handoff

## What changed
- The front page's slogan (`fHero` / `fHeroPhone`, `app/src/theme/type.stylex.ts`, used only by the front page's H1):
  36px on PC (48 before), 28px on a phone (32.25 at 375 before) — the colour cards' titles' size at each.
- The space between the top bar and the slogan (`entry-page.tsx` column `paddingTop`): 16px (32 before), PC and phone.
- ui.md's front-page line says so.

## AC results
Measured at `/en` with `tmp/shot.mjs` (H1 computed font size; header bottom to H1 top), production before vs built after:
1. Title smaller — desktop 48px → 36px; phone 32.25px → 28px. Pass.
2. Space above smaller — 32px → 16px at both. Pass.
3. Slogan text and cards unchanged — `tmp/before-*.jpg` vs `tmp/after-*.jpg`. Pass.
- Mechanical defence: pass (typecheck, build, 342 tests, client bundle, design tokens, no raw styles, server bundle, SEO).

## Deviations
- Phone size first built at 26px; raised to 28px after the look through the human's eyes (it read smaller than the
  cards' titles).

## Environment
- Ports: web 55175, multiplayer 56175, database 57175. Env keys: none changed.
- Local DB: production's board rows and the owner's records (read-only on production), as in SKATGO-174.

## Residual
- None.

## Check
1. http://localhost:55175/en — on PC the space under the slogan (to the cards) is now larger than above it (≈37 vs ≈21
   to the letters); if it should be even, the space under would go from 32px to about 20px.
2. http://localhost:55175/en on a phone — the slogan's size beside the cards.

## Decided for you
- 36px on PC, 28px on a phone: the colour cards' titles' size.
- 16px above, PC and phone; the space under the slogan unchanged (not asked).
