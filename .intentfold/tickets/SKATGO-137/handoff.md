# SKATGO-137 handoff

## What changed

- **Front page, progress card** (`entry-page.tsx`): the curve 6px (`progressCurve`, was 4px); under it the first and the
  last day (`meta`, slate); at its right the AI's blue tag centred on the zero line (`Who`, new `pose.onLine`). The
  drawing fills a box that takes what the card has left, so the card keeps its size.
- **Data**: none changed. Production, read only: olena (her account and the guest id already counted as hers) has 14
  days with the AI's games, konanekane 5 — both get a curve.
- **Charter** `ui.md`: the card's curve.

## AC results

Local web 55137, multiplayer 56137, database 57137; olena's and konanekane's production rows copied into local test
accounts. `tmp/ac.mjs`, PC and phone: ALL PASS.

1. Line 6px — passed.
2. Dates "Oct 9 · Oct 26" (olena), "Oct 16 · Oct 26" (konanekane); the AI tag within 0.01px of the zero line; nothing else
   but the title — passed.
3. Card 522×209 on PC, 351×166 on a phone, as before — passed.
4. Both curves drawn; screenshots `tmp/{pc,phone}-{olena,konanekane}.png` — passed.

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built, SEO tests).

## Deviations

None.

## Environment

Ports: web 55137, multiplayer 56137, database 57137. No env change, no dependency change.

## Residual

None.

## Check

1. http://localhost:55137/en with the test cookie `skatgo_test_account=olena.<ms>` or `konanekane.<ms>` — their cards.
2. After release, signed in — your own card.

## Decided for you

- Dates: the first and the last day. Vertical label: the AI's tag on the zero line.
- 6px.
