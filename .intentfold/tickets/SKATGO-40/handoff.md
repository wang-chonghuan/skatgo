# SKATGO-40 handoff

## What changed

**Pool of deals — `multiplayer/scripts/make-free-pool.ts`, `multiplayer/skatzero/free-pool.json.gz`**
- A one-off generator deals with a fixed seed (`skatgo-free-pool/1`). Each deal's deck, dealer and
  the order the computers try the 231 skats are fixed by its index, so the pool is the same however
  many processes make it. It works out both computers' SkatZero bidding with SKATGO-39's
  `seatBidding`/`skatOrHand`.
- Each deal stores: dealer, deck, and per computer seat the highest bid plus one letter per SkatZero
  bid value (`P` pick up, or the Hand game `C S H D G N`, `O` = Null Ouvert Hand).
- Generated: **1,000 deals, 39,325 bytes gzipped, 8.7 min with 14 processes** on this Mac. The
  manifest's `freePool` entry records size, SHA-256, count and seed. Running the generator with a
  larger count extends the pool deterministically; earlier deals stay identical.

**Multiplayer — `src/computers.ts`, `src/free.ts`, `src/server.ts`, `src/daily.ts`**
- `computers.ts`: the computer-turn machinery moved out of `daily.ts` unchanged — `decide` (2 s
  limit), `replayLog`, `skatzeroTurn`, `advance`. `daily.ts` now imports it and gives it its stored
  per-day plan. Tournament behaviour is unchanged.
- `free.ts`:
  - `loadPool` checks the asset against the manifest (bytes, SHA-256, count) and the bid list. An
    altered pool throws, and the service exits on start (readiness never true).
  - A game is an AES-256-GCM token (key = HKDF-SHA256 of the admission key, label `skatgo-free/1`)
    holding `{pool version, deal id, start time, every move so far, the computers' included}`.
    Tokens expire after 24 h. Replay runs the engine only, never the model; only new computer moves
    are worked out. The server keeps nothing per game.
  - Routes `POST /free/new` and `POST /free/act` (admission key, strict input). They return
    `{token, steps (seat views), revision, computer}`.
  - Errors: tampered token → 409 `invalid_game`; expired or other pool → 409 `game_expired`; stale
    revision / not your turn → 409; computer timeout → 503 `computer_unavailable` (no fallback).
  - Computers: auction and pick-up/Hand come from the pool's decisions. Discard/game after a pick-up
    and the cards are SkatZero live, as on `skatzero@1fe5cab` tournament days.
- `server.ts`: readiness waits for the models **and** the pool. Routes are mounted at `/free`.

**Web — `app/src/lib/free-handler.ts`, `free-api.ts`, `server.ts`**
- `/api/free/new` and `/api/free/act` proxy to the multiplayer service with the admission key.
- Rate limits per address: 300 new games an hour and 200 moves per 10 s; over the limit → 429
  `slow_down`.
- No cookie.

**Table — `server-table.tsx` (new), `game-table.tsx`, `free-table.tsx`, `lesson-player.tsx`**
- `ServerTable` holds the token in memory only (a reload starts a new game). It replays the
  computers' steps with the usual delays.
- On failure it shows "Can't reach the server…" / "Too many requests…" / "This game has expired…",
  with *Try again* (same move, same token) and *New game*.
- `GameTable` takes a generic `server` source next to `tournament`. Hints and the assistant stay on
  for the server table and stay hidden in the tournament.
- Free play (`/play`) and lesson 11's game step use `ServerTable`. The tally and lesson completion
  are recorded from the settled game as before.
- Messages (en/de): `free_new_game`, `free_unreachable`, `free_slow_down`, `free_expired`.

**Tests — `multiplayer/test/free.test.ts`:**
- token round-trip;
- refusal of a tampered token and of another key's token;
- the token is opaque;
- the pool loads (version, ≥ 1,000 deals);
- an altered pool is refused.

## AC results

Local: web 55040, multiplayer 56040, PostgreSQL 57040. Scripts are in `tmp/`: `free-check.mts`
(headless) and `ui-free.mjs` (browser, desktop 1280×820 and phone 375×812).

**Mechanical defence:** PASS
- app: typecheck, build, 75/75 tests, client-bundle and design-token checks, no raw styles, server
  bundle links;
- `npm --prefix multiplayer run check`: 19/19.

**AC1 — SkatZero on the server, legal, nothing hidden:** PASS
- 10 whole games through `/api/free/*`, all from pool `skatzero@1fe5cab`.
- All 258 computer moves replay legally through the engine.
- Every bid and skat choice equals the pool's stored decision. Discards, games and cards equal what
  SKATGO-39's code gives for that seat's view.
- No opponent card and no unseen skat appears in any response's steps. The token is opaque, and
  tampering one byte → 409 `invalid_game`.
- Browser: `/en/play` opens a server game (`skatzero@1fe5cab`) and deals 10 cards; a move is answered
  (desktop and phone).

**AC2 — lesson 11:** PASS (desktop and phone)
- The game step plays on the server.
- Once settled through the page's own request, *Continue* is enabled and the game is recorded in the
  tally.

**AC3 — opening without simulation:** PASS
- 50 openings, timed from `new` to the player's first playable move (computer auction answers
  included): p50 14 ms, p95 17 ms, max 25 ms.
- No bidding simulation runs in play; the auction is a pool lookup.

**AC4 — hints and offline:** PASS
- The bid hint answers with a reason (desktop).
- Offline, a move shows "Can't reach the server…". Back online, *Try again* sends the same move and
  the game continues. *New game* starts a fresh server game.
- Free play's settled game moves the tally (games 0 → 1).

**Grill additions:**
- Tampered token refused: PASS.
- An earlier token resent gives identical computer answers: PASS. The computers' moves come only from
  the pool and the engine.
- Unknown extra field refused (400): PASS.
- Altered pool refused at start: PASS by `free.test.ts` (`loadPool` throws `free_pool_altered`). The
  service exits on that error; this was not re-run against a live service.
- No cookie and no browser storage added (against a baseline visit, Clerk's own entries settled):
  PASS. The only key touched is the course's existing progress key.
- No page errors.

## Deviations

- **Pool 5,000 → 1,000 deals.** The 5,000-deal run with 12 processes had not finished one worker
  after ≈ 30 min. At the human's word it was stopped and 1,000 deals were generated instead. The pool
  can be extended later with the same seed.
- **Lighter acceptance at the human's word** ("基本可以就行了"):
  - 10 games instead of 50;
  - 50 openings instead of 200.
- **Rate limit during the headless check.** The product's own limit (200 moves per 10 s) answered
  429 during the openings. The script waited 1 s and retried (9 waits); the waits are kept out of the
  timings.
- Otherwise as `plan.md`.

## Environment

- Ports: web 55040, multiplayer 56040, PostgreSQL 57040.
- **No env key added, changed or removed.** The token key is derived from the existing admission key.
- No schema change and no production data.
- No new dependency (`node:crypto`, `node:zlib`). The Docker image is unchanged.

**Deploy:** multiplayer first (readiness waits for the pool), then web. 38 and 39 are not deployed
yet; this branch sits on top of them.

## Residual

**Charter drift (not edited; human-owned):**
- `engineering.md` line 48 says "Rooms, free play, lessons and hints keep the heuristics". Free play
  and lesson 11's game now play SkatZero on the server; rooms, the other lessons and hints keep the
  heuristics.
- `engineering.md` line 223 says "Drills and the solo deal use `Math.random`". The solo deal now comes
  from the server pool.
- `operations.md` (lines 18–37, 159) lists `/api/daily/*` and `/daily` only. It should add
  `/api/free/*` → `/free`, and say that readiness also waits for the free-play pool.

**Public pool:**
- The repository is public, so the pool's decks are readable. Someone could look up a free-play deal
  from their own hand and see the opponents' cards. The stakes are low: free play is unranked and the
  tournament does not use the pool.
- A future ticket could keep the pool outside the repo (e.g. as a private asset).

**Bigger pool:** a larger pool, if repetition is noticed, needs only a longer generator run.
