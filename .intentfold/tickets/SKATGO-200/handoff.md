# SKATGO-200 handoff

## What changed

- `app/src/theme/breakpoints.stylex.ts`: `bp.markOnly`, `@media (max-width: 429px)`.
- `app/src/components/skat/frame.tsx`: the header's name "SkatGo" hides under `bp.markOnly` (was `bp.narrowPhone`,
  359px). Gaps, flags, gear, sign-in button and header height unchanged.
- `.intentfold/charter/ui.md`: the header line says the mark alone under 430px (SKATGO-200).

## AC results

Production build on http://localhost:55200, a guest.

1. **PASS.** `/de/kurs/wie-funktioniert-skat`, `/` (German front page) and `/en` at 320, 360, 375, 390, 414, 429, 430,
   440 and 1280px: page overflow 0 at every width (production had 36px at 360 and 21px at 375 in German, 8px at 360 in
   English); the sign-in button's right edge always inside the viewport.
2. **PASS.** From 430px the name shows beside the mark (screenshot `tmp/de-430.png`); at 1280px the header is as before.

Mechanical defence passed (typecheck, build, 346 tests, client bundle, design tokens, literal grep, SSR link,
`check:seo --built`, `test:seo`).

## Deviations

The plan's first threshold, 400px, was raised twice while checking: at 400px German still ran 3px over, and at 410–414px
the name touched the British flag. 430px is where both fit with the header's own spacing.

## Environment

Port web 55200. No env keys changed.

## Residual

None.

## Check

1. https://skatgo.com/de on a phone — the header: mark, flags, gear, "Anmelden", no sideways scrolling.

## Decided for you

- One threshold for both languages (English also ran 8px over at 360px).
- Below 430px the name "SkatGo" is hidden in both languages; the logo mark stays.
