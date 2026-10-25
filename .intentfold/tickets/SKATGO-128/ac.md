# SKATGO-128 AC check plan

Local web 55128, multiplayer 56128, database 57128, seeded with a copy of one production player's tournament
days (and their days' deals) under a local test account. Desktop 1280×820 and phone 375×812.

1. **Signed-in opens the profile; a guest is asked to sign in.** Playwright: `/en/profile` with the test-account
   cookie shows the H1, the curve and the day list; without it, the sign-in button and no data. Pass: both.
2. **Deals per day match.** Compare the day list's counts with a SQL count of that player's finished tournament
   deals per day plus recorded free deals. Pass: equal for every day.
3. **One point per deal, own minus AI.** Playwright reads the curve's points (`data-diff` per point); compare
   count and values with the SQL. Pass: same count, same differences.
4. **A finished free deal adds a deal and a point.** No game is played (acceptance plays no games): a
   multiplayer test records a free deal through the recording function twice (one row), then the profile
   shows it on its day; the web proxy's naming of the player is covered by a handler test. The live free-play
   path is left to the human. Pass: tests green.
5. **Readable on phone and PC, no sideways scroll.** Screenshots at both sizes; `scrollWidth <= innerWidth`.
