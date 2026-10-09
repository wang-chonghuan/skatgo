# SKATGO-63 AC check plan

Local web 55063, multiplayer 56063, database 57063, with today dealt locally. Headed Playwright at desktop 1280×820 and phone 375×812. Deals are driven by scripted legal moves through the API, never played for their own sake.

1. **A visitor who has not played today sees all 6 deals, each unplayed, with no cards.**
   - Fresh context, open `/de/taeglich` (and `/en/daily`).
   - Pass: the table inside the tournament page has exactly `of` (6) deal rows, numbered 1–6, each marked unplayed. The table contains no card (`[data-card]` count 0 inside it).
   - Also with JavaScript off: the server's HTML already holds the same 6 rows (grill Q3).
2. **After deal 1, still 6 rows: deal 1 with its result, the other 5 unplayed.**
   - Drive deal 1 to its end through `/api/daily/*`, then reload `/de/taeglich`.
   - Pass: 6 rows; row 1 is a finished row whose score equals the status's deal-1 score; rows 2–6 are marked unplayed (row 2 as the next deal).
3. **All 6 finished: every row shows its result.**
   - Drive deals 2–6 to their end, reload.
   - Pass: the result's table has 6 finished rows, each score equal to the status's; no unplayed row.

Screenshots of each state at both sizes; no horizontal overflow; no page errors.

Mechanical defence per `engineering.md` Tools.
