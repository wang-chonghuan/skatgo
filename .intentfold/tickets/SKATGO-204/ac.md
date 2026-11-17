# SKATGO-204 acceptance checks

Local only: web on 55204 (production build), multiplayer on 56204, database on 57204. Signed-in checks use local test
accounts (`skatgo_test_account`). Scripts in `tmp/`. Every UI check at 1280×820 and 375×812. Gameplay itself is not
played through by the scripts (deals are left to the human); a round's scoring is checked by unit tests and by the
service with a round driven through the room's SDK protocol at a short AI beat.

1. **Guest sees tiers and sign-in, cannot play or check in.** Playwright, fresh context, `/en/league`: six tier names and
   fees 10/12/15/20/25/30, a sign-in button, no play button. `POST /api/league/play` and `/api/league/checkin` without an
   account → 401. Pass: all hold.
2. **Check-in once a day, accumulating.** Fresh test account: open `/en` → `state.coins` 100; open again → still 100.
   Then set the row's `checkin_day` to two days ago and coins to 40 (local DB), open → 140; a day with no open adds
   nothing (the row's day only moves on an open). Pass: 100, 100, 140.
3. **New account Bronze 0; a round costs 10; too few coins blocks.** New account: league page shows Bronze, 0 points;
   start a round → coins −10 (state before/after). Set coins to 5 → play button disabled with the "tomorrow" line, and
   `/api/league/play` → 409 `not_enough_coins`; `/api/free/new` and `/api/daily/state` still answer 200. Pass: all hold.
4. **Matching.** One account plays alone: seated in ≤ 5.5 s (measured), the other two seats are personas (not
   accounts, names from the roster). Two accounts start the same tier within 5 s: same room id. Pass: both.
5. **Three deals, each deals once; each result like free play with the AI comparison and XP.** The room deals three
   times, dealers all different (SDK run at a short beat). Browser: after a deal the result dialog shows the XP line
   and "If the AI had played your cards"; a `play_deals` row appears for the account. Pass: all hold.
6. **Round result and standings.** Unit tests of `placesOf` / `standingAfter`: +3/+1/−2, ties to the better place,
   +12 up, −8 down, points to 0, Bronze never down, Legend never up. Service: a finished round writes each human's new
   points/tier once (re-running the finish changes nothing). Browser: the round result shows place and ±points.
7. **Disconnect.** SDK: a seated account drops; after 30 s its seat is AI-controlled; it rejoins with a new ticket and
   the round goes on; coins are unchanged by the drop (no refund). Pass: all hold.
8. **Words and widths.** `/en/league` and `/de/liga` show League / Liga and Bronze … Legend / Bronze … Legende;
   `document.documentElement.scrollWidth <= innerWidth` at 375 for the league page and the home page. Pass: all hold.
9. **Home cards.** `/en`: the four tiles in order daily, play, course, league; the league tile goes to `/en/league`; the
   picture cards are friends, forum, tricks, bidding; bidding goes to `/en/bidding-practice`; other links unchanged.
   Pass: all hold, both widths.
10. **Legend board.** Local DB: two accounts in Legend with points, one persona-free; the board lists them by points,
    the viewer's row marked; no `sim:` row. Pass: all hold.

Mechanical defence (engineering.md Tools) and `npm --prefix multiplayer run check` once before the handoff.
