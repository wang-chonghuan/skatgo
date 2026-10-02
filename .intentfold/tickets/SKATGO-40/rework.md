# SKATGO-40 rework

## Round 1 — 「charter都改为和实际一致」 (e932061)

The human authorized bringing the charter in line with what SKATGO-40 delivered. These are the three
drifts the handoff listed under Residual.

**engineering.md**
- Stack: free play (`/play`) and lesson 11's game now play SkatZero on the server, with their bidding
  taken from the committed pool. Rooms and hints keep the heuristics.
- Module map:
  - the web's `/api/free/*` proxy, `free-api.ts` and `server-table.tsx`;
  - multiplayer's `src/free.ts`, `src/computers.ts` and `scripts/make-free-pool.ts`.
- New key decision on the free-play design:
  - the committed, hash-checked pool of 1,000 deals, which readiness waits for and which can be
    extended with the same seed;
  - the AES-256-GCM token with a 24 h lifetime;
  - replay without the model, and no cookie or browser storage;
  - the public pool, accepted because free play is unranked.
- Course randomness: only drills use `Math.random`. The solo deal now comes from the server's pool.

**operations.md**
- `web` also serves `/api/free/*`, with its per-address limits (300 new games an hour, 200 moves per
  10 s, `429 slow_down`).
- `multiplayer` also serves `/free`. Free play stores nothing; changing the admission key ends the
  games in progress.
- Readiness waits for both the models and the pool; a missing or altered pool stops the service at
  start.
- Locally, without `MULTIPLAYER_URL` and the admission key, `/api/free/*` answers 503 too.

**Rechecked:** no product criterion. The change is charter text only. The mechanical defence ran
once over the final branch at close.

**Net effect against the frozen handoff:** the handoff's Residual item "charter drift (not edited)"
is resolved. Code and acceptance results are unchanged.
