# SKATGO-36 acceptance checks

Local stack on the ticket ports (web 55036, multiplayer 56036, PostgreSQL 57036). No gameplay in the
browser: whole days are played through `/api/daily/*` headless (as in SKATGO-35's check), the browser
checks what the pages show. Desktop 1280×820 and phone 375×812, headed.

## AC1 — a guest and a signed-in player, ranked by total

- A guest (cookie jar) and a signed-in player (Clerk **dev** test account, `+clerk_test` address, via
  the browser session) each finish today's 12 deals and enter a nickname.
- **Pass**: `/daily` lists both, ordered by total descending, with the correct rank, nickname and
  total (equal to `daily_entries`); in each player's own browser their row is highlighted
  (`data-me`). A tie gets the same rank (checked with a seeded tie in the local DB).

## AC2 — finished but unnamed: own total and "would be #n"; named: on the board; no real names

- A finished guest without a nickname is not in the board's rows; the page shows their total and the
  rank they would have. After entering a nickname, the row appears.
- **Pass**: no board response or page contains the Clerk account's first/last name, username or
  email (checked against the test account's values).

## AC3 — yesterday's final ranking; today's board starts empty

- Restart the local multiplayer with the acceptance-only clock shift past Berlin midnight.
- **Pass**: today's board is empty; "yesterday" shows the ranking from AC1 unchanged.

## AC4 — no consent banner, no new storage

- A fresh guest: open `/daily`, play the day through the page's own requests (API-driven), enter a
  nickname.
- **Pass**: no consent banner/dialog appears; compared with a baseline visit to `/daily` before this
  ticket's flow, the only added storage is the `skatgo_daily` cookie (cookies, `localStorage`,
  `sessionStorage`, IndexedDB compared).

## Nickname filter (grill Q3)

- **Pass**: through `/api/daily/name`, a listed word (and its upper-case / accented spelling) is
  refused with the neutral message only; an ordinary name containing a listed word only as a
  substring is accepted; `@`, a URL, 1 or 21 characters are refused.
