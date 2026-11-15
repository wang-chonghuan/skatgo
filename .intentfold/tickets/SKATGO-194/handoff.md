# SKATGO-194 handoff

## What changed
- `app/src/components/skat/daily-table.tsx`: `Leaderboard` takes `hidden` — the rows without totals (and none in their
  data attributes), no "Points" head, the AI's row last and without its score.
- `app/src/components/skat/deal-of-day.tsx`: passes `hidden` while today's deal is not finished and today's board is shown.
- Charter `ui.md`: the deal of the day's board before it is played.

## AC results
`tmp/ac.mjs`, production build, /en/daily with the state and board answers mocked — ALL PASS: unfinished → Anna and Ben
shown, no score anywhere on the board, the AI's row last; finished → names and scores (+120, +40, −30) as before.
Screenshots `tmp/before.png`, `tmp/after.png` looked at. Mechanical defence passed.

## Deviations
None.

## Environment
web 55194 (stopped). No env keys changed.

## Residual
- The board's answer from the server still carries the totals; only the page hides them. Hiding them in the service too
  would close the browser's developer tools as a way to read them.

## Check
1. /daily before playing today's deal: names only.

## Decided for you
- The AI's row stays, last and without a score.
- Earlier days' boards and the 6-deal tournament are unchanged.
