# SKATGO-138 handoff

## What changed

- **Front page, progress card** (`entry-page.tsx`): the curve 5px (was 6px), in `navy`, the player's colour (was `info`,
  the AI's blue); the AI tag on the zero line removed. Dates and the card's size unchanged.
- **Tokens**: `progressCurve.line` 6 → 5; `pose.onLine` removed (only the tag used it).
- **Charter** `ui.md`: the card's curve.

## AC results

Local web 55138; olena's and konanekane's production rows in local test accounts. `tmp/ac.mjs`, PC and phone: ALL PASS —
no AI tag; 5px; stroke `rgb(2, 38, 87)` (navy); card 522×209 / 351×166 as before.

Mechanical defence: passed (283 tests, tokens, literal grep, SSR, SEO built, SEO tests).

## Deviations

None.

## Environment

Ports: web 55138, multiplayer 56138, database 57138. No env change.

## Residual

None.

## Check

1. http://localhost:55138/en with `skatgo_test_account=olena.<ms>` — the card.

## Decided for you

- The line in navy, the player's own colour, so blue stays the AI's.
- 5px.
