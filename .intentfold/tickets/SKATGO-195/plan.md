# SKATGO-195 plan

`multiplayer/src/daily.ts` `dailyBoard`: size 1, today, the asker not finished → every total null, the AI total null,
`hidden: true`. Types in `app/src/lib/skat/tournament.ts`. `Leaderboard` reads `hidden` and null totals; the `hidden` prop
and DealOfDay's own reckoning from SKATGO-194 removed. Two persona tests read today's deal-of-the-day board as nobody
and expected totals: corrected to the new rule (hidden today, totals on the board seen from the next day).
