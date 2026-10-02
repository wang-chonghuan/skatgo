# SKATGO-40 grill

Mode: `Grill: human` when the batch was written; the human then authorized self-adjudication for this
ticket (2026-10-02, 「请回答grill问题，工单40的」; the ticket's Grill row is now `self`). Answers below are
recorded by the pm session under that authority, from the Charter and observation. Reviewed: live SKATGO-40; `free-table.tsx`, `lesson-player.tsx`, `game-table.tsx`,
`daily-table.tsx`, `hints.ts`, `lib/ask/limits.ts`; merged SKATGO-38/39 (`multiplayer/src/daily.ts`,
`src/skatzero/*`), `multiplayer/render.json` (DB 1 GB).

## Batch 1 (2026-10-02)

### Q1. Production changes (operations.md Redline 5)

- (a) New table `free_deals` (the pool) in `skatgo-multiplayer-db`, created by `migrate()` at deploy.
- (b) A one-off import of the pool into production (≈ 5,000 rows, ≈ 6 MB) by a script an operator
  runs after deploy; idempotent (re-running adds nothing).
- No env key, no new resource.
- **Recommended**: approve both.
- **Decision** (pm, self-adjudicated): **not needed — the route changes (Q3) so that production gets
  no new table and no import.** Nothing in this ticket then needs a Redline 5 approval. The ticket's
  Constraint about storing the pool in the database is amended to match, with a comment.

### Q2. Where a game lives

- **Recommended**: nowhere on the server. The state travels with the page as an encrypted,
  authenticated token (AES-256-GCM; key derived from the existing admission key, so no new secret):
  pool deal, moves so far, start time. The server decrypts, replays, moves the computers, and returns a
  new token. No per-game table, no cookie, no browser storage; a reload starts a new game as today.
  Tokens older than 24 h are refused.
- **Alternative**: a `free_games` table (another Redline 5 item, rows to clean up).
- **Decision** (pm, self-adjudicated): **accepted — no per-game state on the server; an encrypted,
  authenticated token in the page** — with three conditions:
  - **The token carries the full move list, the computers' moves included.** Replay applies recorded
    moves through the engine and never calls the model or the bidding, as SKATGO-38 decided for the
    tournament ("recorded, not recomputed"). Two reasons, both observed: SKATGO-39 measured macOS vs
    Linux model outputs differing in the 6th digit, so recomputing after a restart or a host change
    could diverge; and replaying recorded moves costs nothing.
  - The token key is derived from the admission key with HKDF and a label of its own (`skatgo-free/1`),
    never the admission key itself.
  - Tokens expire after 24 h.
  Basis: the ticket forbids browser storage that needs consent, and a `free_games` table would be one
  more Redline 5 item with rows to clean up.

### Q3. The pool

- **Recommended**: 5,000 deals generated locally with SKATGO-39's bidding code in parallel processes
  (≈ 20–30 min on this Mac), each storing both computers' highest bid and, for every SkatZero bid
  value, the decision pick-up or which Hand game (not the full value tables: ≈ 1 KB per deal instead of
  ≈ 13 KB). Labelled `skatzero@1fe5cab`. A game draws a deal at random (with replacement), so repeats
  are rare (two games share a deal with probability 1/5,000).
- **Decision** (pm, self-adjudicated): **pool accepted, storage changed**: generate 5,000 deals as
  proposed, but ship them like SKATGO-38's models and SKATGO-39's tables.
  - Commit them as a hash-verified asset in `multiplayer/`: seeded, labelled `skatzero@1fe5cab`, the
    hash in the manifest, gzip if it helps.
  - Verify the hash at startup and load it into memory (≈ 5–6 MB against about 236 MB of headroom).
  - No `free_deals` table, no import script, no write to production data.
  - Random draw with replacement; the token names the pool version and index.
  Basis: hermetic builds and no operator step against the production database (operations.md Redlines
  2 and 5 never come into play). A seeded generator lets the pool be regenerated identically.

### Q4. Rate limit

- **Recommended**: in the web proxy, per address: 60 new games per hour and 30 moves per 10 seconds;
  beyond that a polite "slow down" answer. Same in-memory pattern as the assistant's limits.
- **Decision** (pm, self-adjudicated): **accepted with higher limits**: per address, 300 new games an
  hour and 200 moves per 10 s; beyond that a polite "slow down". Basis: `product.md` says the learners
  are 6 to 99, so a classroom or a family shares one address, and 60 games an hour would block a
  school class. A game costs little (no bidding simulation; a live discard about 5 ms), so the limit
  only has to stop abuse. Same in-memory pattern as `lib/ask/limits.ts`.

### Q5. Lesson 11

- **Recommended**: the same server game as free play, with hints; the lesson counts the game as
  solved when it is settled, and the result goes into the tally, exactly as now.
- **Decision** (pm, self-adjudicated): **accepted** — lesson 11 plays the same server game with hints;
  settling it marks the step solved and records the result, as now.

### Q6. When the network or the server fails

- **Recommended**: the table shows "Can't reach the server — check your connection" with **Try
  again** (re-sends the same move; the token makes it safe) and **New game**. Nothing is lost locally
  because nothing is stored locally.
- **Decision** (pm, self-adjudicated): **accepted** — "Can't reach the server" with *Try again* (the
  same move and token) and *New game*; strings in `en` and `de`.

### Q7. Seats and variety

- **Recommended**: the player is seat 0 as now; the pool deal's dealer is random per deal (as dealt),
  so positions vary as they do today.
- **Decision** (pm, self-adjudicated): **accepted** — the player is seat 0; the dealer as dealt in the
  pool deal.

### Q8. How acceptance proves it

- **Recommended**: as `ac.md` — 50 headless games with every computer move checked against the pool
  and SKATGO-39's code; response scans for hidden cards; 200 openings timed; browser only for
  opening, one move, hints, offline and lesson 11's completion.
- **Decision** (pm, self-adjudicated): **accepted** with the human's limits: the headless API run
  (50 games and 200 openings) finishes in under a minute (pool generation not counted); no deal is
  played through in the browser. Added checks:
  - a token from an earlier move cannot inject a different computer move (tampered → refused);
  - the pool asset's hash is refused when altered;
  - free play adds no cookie and no storage.

## Outcome

All eight resolved, self-adjudicated under the human's authorization. No Redline approval is needed
after Q1/Q3. Fold into `plan.md` / `ac.md`:
- **Q3**: the pool becomes a committed, hash-verified asset loaded into memory; drop the `free_deals`
  table and the import script.
- **Q2**: the token carries every move, computers' included; replay never runs the model; the HKDF
  label; 24 h expiry.
- **Q4**: limits of 300 games an hour and 200 moves per 10 s per address.
- **Q8**: the added checks.
The ticket's Constraint on the pool's storage is amended (live ticket + comment).

