# SKATGO-206 acceptance checks

Local: web 55206 (production build), multiplayer 56206, database 57206; Playwright 1280×820 and 375×812, EN and DE.
No deals are played in the browser. The board's data in the browser checks comes from rows written into the ticket's own
database (League sittings with and without a finished deal, standings across tiers, a tie); the service's own test plays
its deals against a database of its own.

1. **Who is on it.** Service test: after the test's deals, `state`'s board holds every account that sat at them, with its
   tier and points; `user:poor` (League row, never seated) is not on it. Browser: the seeded accounts with a finished
   deal are rows of the board at the bottom of `/en/league`; the seeded account with a sitting but no finished deal and the
   one with only a League row are not; nobody but accounts appears.
2. **Order and row.** Browser: the rows run by tier from Legend down to Bronze and, within a tier, by points from most to
   fewest; equal tier and points share the rank number. Each row is, left to right: the rank, the tier's badge image
   (loaded, the tier's name as its alt), the name, the points at the right edge.
3. **Own row follows the standing.** Browser, signed in as a seeded account: its row is marked "You". The account's
   standing is then changed in the ticket DB as a deal would leave it (points, then a tier move); reopening the page shows
   the row's new badge, points and rank, still marked. Service test: the asker's row carries `you`, after its deals.
   An account beyond the first 100 (seeded) sees "…" and its own row with its rank after the 100.
4. **Guests.** Browser, signed out: `/en/league` shows the same board, no row marked.
5. **No Legend board.** Browser: the page has one board, titled "League ranking"; the words "Legend board" / "Rangliste der
   Legenden" are nowhere on it.
6. **Fits.** Browser, EN and DE at 375 and 1280: every row's rank, badge, name (cut with "…" when long) and points sit on
   one line inside the card (row height one line; the points' right edge inside the card); no sideways scroll.

Mechanical defence (engineering.md Tools) and the multiplayer suite once before the handoff.
