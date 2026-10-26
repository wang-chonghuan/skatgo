# SKATGO-136 handoff

## What changed

- **Front page, progress card** (`entry-page.tsx`): the days are one SVG path, a monotone cubic (Fritsch–Carlson) through
  each day's point — smooth, never above or below two days between them — 4px with round ends (`progressCurve.line`,
  twice `/profile`'s 2px), no dots; a single day shows as its dot (`progressCurve.dot`).
- **Token** `progressCurve` in `theme/constants.ts` (approved by the request).
- **Charter** `ui.md`: the card's curve.
- `/profile`'s curve unchanged (Constraint).

## AC results

Local web 55136, multiplayer 56136, database 57136; test accounts with ten days and with one day of free-play records
written to the local database. `tmp/ac.mjs`, PC and phone: ALL PASS.

1. Ten days are one path of nine cubic segments, no polyline; 400 samples along it all stay within the two days around
   them — passed.
2. Stroke 4px (was 2px) — passed.
3. A single day shows as its dot — passed.

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built, SEO tests).

## Deviations

None.

## Environment

Ports: web 55136, multiplayer 56136, database 57136. No env change, no dependency change.

## Residual

None.

## Check

The look through the human's eyes was not run: the human asked to deploy at once (auto-deploy).

1. https://skatgo.com/en signed in — the progress card's curve.

## Decided for you

- A monotone cubic through the real points, not an average of days.
- 4px, round ends, no dots but a single day's.
