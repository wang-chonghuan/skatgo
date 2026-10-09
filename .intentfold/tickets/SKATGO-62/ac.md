# SKATGO-62 AC check plan

Local web 55062, multiplayer 56062, database 57062. The fresh local database is dealt by the new code. Headed Playwright at desktop 1280×820 and phone 375×812 (`isMobile`, `hasTouch`). The day is driven through the page's own API with passes and first legal cards, as SKATGO-48's check did; no game is played for its own sake.

## AC1 — A new day shows 6 deals; 6 deals finish the day and reach the board

- **Check**: `/de/taeglich` and `/en/daily`:
  - the H1 and meta description name 6;
  - the button reads "Spiel 1 von 6" or the start;
  - the preview image (`og:image`) is the redrawn one.
- **Check**: drive the day: after deal 6 the day is finished (`status.finished`), with no seventh deal. Set a nickname; the player's row is on the board.
- **True when** all hold at both sizes.

## AC2 — The AI comparison and the total cover exactly 6 deals, matching each deal

- **Check**: `/api/daily/state`: `deals` and `benchmarks` have 6 entries each, and `totals[0]` equals the sum of the six deals' scores.
- **Check**: the result table on `/daily` has 6 rows, and its total row equals that sum.
- **True when** both hold.

## AC3 — No 12-deal day or record remains in production after the release

- **Check** (at deploy, cap4):
  - a read-only Render job lists `daily_deals` with the length of each day's deals, and the count of `daily_entries`;
  - after the deletion and the re-deal: only today and tomorrow, 6 deals each, and no entry from before.
- **Check** (locally, now): a database holding a 12-deal day, after the same deletion step, is re-dealt as 6 on the next request.
- **True when** both hold.

## Mechanical defence

As `engineering.md` Tools names it, plus `npm --prefix multiplayer run check`.
