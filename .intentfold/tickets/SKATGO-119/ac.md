# SKATGO-119 acceptance checks

Local: web 55119, multiplayer 56119, database 57119 (built server, headed Chromium, 1280×820 and 375×812).

1. **Taller boxes** — open the forum composer as a signed-in test account: the text box's height is several lines
   (≥ 5 lines of its line height), the comment box ≥ 3 lines; typing 15 lines makes the text box taller still.
   Both viewports.
2. **No twelve on the pages** — `/de/taeglich`, `/en/daily`, `/`, `/en`: no "6 | 12" switch, no "12" deals in
   visible text, title or meta description; `/en/daily?deals=12` and `/en/daily/play?deals=12` show the
   six-deal tournament (six rows / the table of a six-deal day).
3. **No twelve on the server** — `/api/daily/state` with `size: 12` (and with any `size`) → 400; multiplayer start
   logs `daily_prepared` only for six-deal days (local database: no new size-12 `daily_deals` rows after a fresh
   start); a six-deal day can be started, a move played, the board and a review read.
4. **Data kept** — size-12 rows in `daily_deals` / `daily_entries` counted before and after (local database seeded
   with size-12 rows by the previous code); production counted read-only before and after deploy.
