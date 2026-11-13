# SKATGO-192 handoff

## What changed
- `app/src/components/skat/deal-history.tsx`, phone (≤ 480px) only: line 1 the contract, the crown (declared games) and
  the jacks, aces and tens on one line, cut with an ellipsis when they do not fit; line 2 the day at the left and the
  difference to the AI and Replay (record only) at the right. The head stays one line ("Contract" … "vs. AI"). An empty
  crown cell takes no room on a phone. Desktop's one-line table unchanged.
- Charter `ui.md`: the phone rows.

## AC results
`tmp/ac.mjs` — ALL PASS: at 375px and 320px, front card and profile, all 20 rows are two lines as asked; the cards are one
line with `text-overflow: ellipsis`, 2–3 rows cut at 320px, none at 375px; desktop front card still one line a game.
Screenshots looked at. Mechanical defence passed.

## Deviations
None.

## Environment
web 55192, multiplayer 56192, database 57192. No env keys changed.

## Residual
- The history's load time (SKATGO-190's closing comment): waiting for 开工单.

## Check
1. Phone: the two lines on the front card and in Your games.

## Decided for you
- Desktop keeps its one-line table; only the phone layout changed.
- Line 2: the day at the left, the difference and Replay at the right, so the difference stays under "vs. AI".
