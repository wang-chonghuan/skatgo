# SKATGO-195 handoff

## What changed
- `multiplayer/src/daily.ts` `dailyBoard`: today's deal of the day (size 1), when the asker has not finished it (or is
  nobody), returns the names and ranks with every total null, the AI's total null, and `hidden: true`.
- `app/src/lib/skat/tournament.ts`: `BoardRow.total` and `ai.total` may be null; `DailyBoard.hidden`.
- `app/src/components/skat/daily-table.tsx`: `Leaderboard` reads `hidden` and null totals from the board; its `hidden`
  prop is gone. `deal-of-day.tsx` no longer works out the hiding itself (SKATGO-194's page-side code removed).
- Tests: the two persona tests that read today's deal-of-the-day board as nobody now check it hidden, and the totals on
  the same day's board seen from the next day.
- Charter `ui.md`.

## AC results
1. Local stack, Anna (+120) and Ben (−30) finished: as a viewer who has not played and as nobody, the answer has names,
   `"total":null` everywhere, `"ai":{"total":null}`, `"hidden":true`; the page shows names only, the AI's row last.
2. As Anna (finished): totals and the AI's +70, shown on the page. The 6-deal board has no `hidden` and its totals.
`tmp/ac.mjs` ALL PASS; screenshots looked at. Multiplayer `check` 69/69; mechanical defence passed.

## Deviations
None.

## Environment
web 55195, multiplayer 56195, database 57195. No env keys changed.

## Residual
None.

## Check
1. /daily before playing today's deal: names only.

## Decided for you
- Ranks stay before playing; only the scores are withheld.
