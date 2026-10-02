# SKATGO-39 acceptance checks

Local only (web 55039, multiplayer 56039, PostgreSQL 57039); SkatZero's Python `api.py`/`Bidder` at
the pinned commit as the oracle, with the same skat order and zeroed opponent bid features. Scripts
in `tmp/`. No gameplay in the browser.

## AC1 — from the switch day every computer bid, pick-up/Hand, discard and game is SkatZero's, legal

- Players A and B play a whole day through the API (< 1 min). Every computer `bid`, `pickup`/`hand`,
  `discard`, `declare` in the stored logs equals what the stored tables and the live discard/game
  choice give, is accepted by the engine (no illegal bid ever), and A's and B's logs are identical.
- The day is labelled `skatzero@1fe5cab`; earlier recorded and heuristic days read back unchanged.

## AC2 — TS equals Python

- **Highest bid**: ≥ 150 hands across the three positions (17 included), TS vs `api.bid('BID')`.
- **Pick-up or Hand**: for every winning bid from 18 to each hand's highest bid, TS vs
  `SKAT_OR_HAND_DECL` (penalty-free, zero bid features).
- **Discard and game**: ≥ 300 twelve-card hands at their winning bids, TS vs `DISCARD_AND_DECL`.
- Sample counts and every mismatch, with its cause, go into the handoff.

## AC3 — bidding answers without simulating

- Local: server-side time of the requests in which computers answer bids, p95 ≤ 100 ms; a deal's
  tables are read, never recomputed, during play.

## AC4 — same decisions for everyone

- Same deal, same bidding by the human: identical computer bids and declarations (from AC1's logs).
- Preparation: a day's tables computed twice (fresh process) are identical.

## Grill additions

- No route returns tomorrow's (already prepared) cards: `state`/`act`/`board` with the clock on today
  never expose the next day's deals, and the next day's row is present in the DB.
- `/readyz` turns true while a day is still being prepared; preparation runs only in the leader.
- Handoff: a day's preparation time locally, an estimate for Render starter, process memory while
  preparing vs SKATGO-38's peak (≈ 260 MiB).
