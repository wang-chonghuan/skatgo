# SKATGO-40 acceptance checks

Local only (web 55040, multiplayer 56040, PostgreSQL 57040; the pool is the committed asset). Scripts in
`tmp/`. No gameplay in the browser beyond opening, one move, hints and the offline check.

## AC1 — free play's computers are SkatZero's, on the server, and legal; nothing hidden reaches the browser

- Through `/api/free/*`, 50 whole games headless (with the 200 openings of AC3, under a minute): every computer move passes the engine; each game's
  pool version is `skatzero@1fe5cab`; computer bids and skat choices equal the pool's stored decisions;
  discards/games after a pick-up and cards equal what SKATGO-39's code gives for that seat's view.
- Every response (steps and token) is checked: no opponent card or unseen skat in clear; the token is
  opaque (tampering one byte → refused).
- Browser: `/en/play` deals 10 cards from the server, a move is answered, hints answer with a reason.

## AC2 — lesson 11's game runs on the server and completion is recorded

- Browser: the lesson's game step deals from the server; a game finished through the page's own
  requests marks the lesson's game solved and records the result in progress, as before.

## AC3 — opening a game does not simulate

- Server-side time from `new` to the first move the player can make (computer auction answers
  included), p95 ≤ 1 s over ≥ 200 openings; no bidding simulation runs in play.

## AC4 — hints and offline

- Hint buttons answer with reasons on the server table.
- With the network cut (browser offline), a move shows a clear message; back online, "try again"
  continues the same game and "new game" starts one.
- No cookie and no browser storage is added by free play.

## Grill additions

- A tampered token is refused; an earlier token replayed cannot make the computers answer differently
  from what the engine and the pool give for that position (no injected computer move).
- An altered pool asset is refused at start (`/readyz` never true).
- Free play and lesson 11 add no cookie and no browser storage (compared with a baseline visit).
