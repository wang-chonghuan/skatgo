# SKATGO-131 AC check plan

Local web 55131, multiplayer 56131, database 57131. PC 1280×820, phone 375×812. No game played through.

1. **Hero.** Playwright on `/en` and `/de`, as a guest who has not played: the main button is "Today's deal" leading
   to the deal of the day's table; the second is free play; no forum link or announcement in the hero. After a
   finished entry exists for this visitor (written to the local database, not played), the main button reads
   "Today's result · #k" and leads to `/daily`. Both sizes.
2. **After the deal.** With that finished entry, `/daily` shows the toggle, the score block (yours, the AI's, players
   and rank), "share" as the only `go` button, the countdown, today's board with the AI's row, no "not finished"
   tournament line. The share text has no card and no contract (unit test of the text). The jump from the table after
   the last card is left to the human (a game would have to be played).
3. **Seven days of choosing.** A script prepares seven days locally: each day's deal is one of the four kinds,
   neighbouring days differ in kind, the seven are not all the same contract kind, and none is one of that day's
   six. Pass: all, with the time and memory each day took.
4. **Tournament unchanged.** The toggle's other side shows the tournament as now; Elo reads size 6 only (unit test);
   the board and play of the six deals unchanged (existing tests green).
