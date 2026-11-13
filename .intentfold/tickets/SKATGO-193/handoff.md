# SKATGO-193 handoff

## What changed
- `app/src/components/skat/deal-history.tsx`, the front card only: no day (cell and head gone); one line a game on every
  width — the contract, the crown (declared games), the jacks, aces and tens, the difference to the AI; the cards one
  line, cut with an ellipsis when they do not fit (a zero max-width cell lets the table cell shrink). The record of play
  is unchanged.
- Charter `ui.md`: the card's rows.

## AC results
`tmp/ac.mjs` — ALL PASS: desktop, 375px and 320px: 20/20 rows one line, no day, cards nowrap with an ellipsis (0, 2 and 4
rows cut), the list inside the card; profile still 20 days and 20 Replay links. Screenshots looked at (`*-home-cards.png`
scrolled to games with cards: the two newest local games have no cards because their decks are newer than the local copy).
Mechanical defence: typecheck, build, unit tests, client bundle, tokens, literal grep and server link passed; `check:seo`
first timed out on this Mac's slow network (Clerk handshake ETIMEDOUT) and passed on rerun; `test:seo` passed 27 with 1
cancelled at its 180s limit, which passed when rerun alone.

## Deviations
None.

## Environment
web 55193, multiplayer 56193, database 57193. No env keys changed.

## Residual
- The history's load time (SKATGO-190's closing comment): waiting for 开工单.

## Check
1. The front card on a phone and on a computer.

## Decided for you
- One line on the computer too, not only on a phone.
