# SKATGO-40 plan

## What the code already says that the ticket does not

- Free play (`free-table.tsx`) and lesson 11 (`lesson-player.tsx`, the `game` step) both embed the
  local `GameTable`. Each records only the settled result (`onSettled` → `recordGame`, and lesson
  completion), so swapping the table's source keeps the tally and the lesson's completion as they are.
- The hints (`hints.ts`) read only the player's own hand, the public tricks and — as declarer after
  pick-up — the skat: they work unchanged on a table built from the server's seat view
  (`gameFromView`). Same for the assistant's table snapshot (`visibleTable`) on `/play`.
- SKATGO-35's remote table (`DailyTable` → `GameTable tournament`) already plays a server-owned deal
  from seat views and step lists; it hides hints and the assistant, which free play must keep.
- SKATGO-39's bidding costs ≈ 1 s per computer per deal; in play, only the discard/game after a
  pick-up (≈ 7 model runs) and the cards (≈ 1 ms each) are computed live.
- The web has one in-process rate limiter pattern (`lib/ask/limits.ts`); production runs one web
  replica.
- The multiplayer DB is `basic_256mb` with 1 GB disk (`multiplayer/render.json`).

## Route

1. **Pool asset** (grill Q1/Q3): 5,000 deals generated locally with a fixed seed by SKATGO-39's
   `seatBidding` (parallel processes), each with dealer, deck and, for both computer seats, the highest
   bid and the pick-up-or-Hand decision at every SkatZero bid value. Committed as
   `multiplayer/skatzero/free-pool.json.gz` with its SHA-256 in the manifest; verified and loaded into
   memory at start (readiness waits for it, like the models). No table, no import, no production write.
2. **A game without storage** (grill Q2): a game is an AES-256-GCM token (key = HKDF of the admission
   key with label `skatgo-free/1`) holding the pool deal, the pool version, **every move so far,
   computers' included**, and the start time. Replay applies the recorded moves through the engine and
   never asks a computer; only new computer moves are computed. Tokens older than 24 h are refused. No
   cookie, no browser storage; a reload starts a new game.
3. **Multiplayer routes** `POST /free/new`, `POST /free/act` (admission key), reusing SKATGO-39's
   SkatZero turn (decisions from the pool for the auction and the skat choice, live discard/game,
   SkatZero cards) and the 2 s decision limit; no fallback.
4. **Web proxy** `/api/free/new`, `/api/free/act`, per address 300 new games an hour and 200 moves per
   10 s (grill Q4).
5. **Table**: `GameTable`'s remote source generalised (server game with or without hints/assistant);
   free play and lesson 11 use it with hints and the assistant; the tournament keeps its settings.
   Errors show "Can't reach the server" with *Try again* (same move, same token) and *New game*.

## Redline lookup

| Action | Entry | Result |
|---|---|---|
| Production schema / data | operations.md R5 | none: the pool is a committed asset (grill Q1/Q3) |
| New env key / secret | operations.md R5 | none: the token key is derived from the existing admission key |
| New dependency | engineering.md R3 | none (`node:crypto`) |
| Browser storage | ticket constraint | none |

## Grill outcome

Settled 2026-10-02 (`grill.md`, self-adjudicated under the human's authorization). Q1/Q3: the pool is a
committed, hash-verified asset loaded at start — no table, no import, no Redline 5 item. Q2: the token
carries every move, computers' included; replay never runs the model; HKDF label `skatgo-free/1`; 24 h
expiry. Q4: 300 games/h and 200 moves/10 s per address. Q8: API run < 1 min; three added checks.
