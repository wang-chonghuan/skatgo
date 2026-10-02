# SKATGO-39 plan

## What the code and the reference already say that the ticket does not

- **SkatZero's bidding is three calls of `api.py`, all built on `bidding/bidder.py`:**
  - `BID`: the hand's highest bid;
  - `SKAT_OR_HAND_DECL`: pick up or Hand, after winning at a given bid;
  - `DISCARD_AND_DECL`: two cards to put away and the game, for twelve cards at the winning bid.
- **`BID` is a simulation.** For every one of the 231 possible skats among the 22 unseen cards, every
  game type (C, S, H, D, G, N, NO) is valued by the net over all 66 discards. Hand values are
  simulated separately; middlehand and rearhand also try every unseen card as an opponent's lead.
  The results become bid-value tables through `SimulatedDataBidder` and the eight `.npy` outcome
  tables (1.1 MB, hashes in SKATGO-22's `provenance.json`).
- **Cost.** Measured here: one ONNX run with 66 candidates ≈ 0.7 ms in Node, so one computer's
  evaluation ≈ 231 × 7 × 0.7 ms ≈ 1.1 s on this Mac. A day (12 deals × 2 computers) ≈ 25–30 s, and
  several times that on Render's starter CPU. It cannot run inside a player's request.
- **What decides the result.** A computer's evaluation depends only on its own ten cards, its
  position (forehand/middle/rear) and the order the 231 skats are tried in (upstream shuffles at
  random; the order matters only to a "performance hotfix" that skips hopeless game types). With the
  opponents' bid features zeroed, as in SKATGO-38's card play, everything except the final discard
  and game choice is known when the deal is dealt.
- **`get_max_bid` returns 17** when a hand is just short of 18 (`table[18] > threshold − 5`); the
  product protocol has no 17.
- **SkatZero's bid list** (40 values, up to 168) lacks some product ladder values below 168
  (e.g. 117, 130); a computer can win at one only if a human bids it.
- **Upstream mixes float32 and float64**: net values are float32; per-skat sums of estimates are
  float32; tables and interpolation are float64. A literal port emulates float32 (`Math.fround`)
  where numpy keeps float32.
- SKATGO-38 left recorded days (`skatzero-play@1fe5cab+heuristic-bid`) and heuristic days; both stay
  as they are.

## Route

1. **Tables**: the eight `.npy` files committed under `multiplayer/skatzero/bidding/` with their
   SHA-256 in the manifest, parsed in Node (a tiny `.npy` reader); no conversion step, no Python.
2. **Port** (`multiplayer/src/skatzero/bidding.ts`): `SimulatedDataBidder` (bid list, tables with
   the ±extremes, `np.interp`, Schneider/Schwarz/lost, Null limits, penalties), `calculate_max_bids`,
   `Bidder` (`prepare_state` colour swaps, `simulate_player_discards`, `get_blind_hand_values`,
   `get_blind_hand_bidding_table`, `find_best_game_and_discard` with the hotfix,
   `update_value_estimates`), `get_max_bid`; the `drueck`/`pos` encoder fields and the 12-card
   (66-pair) candidates join `encode.ts`.
3. **Per deal, ahead of time** (grill Q1): for each computer seat, run one full evaluation (231 skats,
   seeded order) and store with the deal: the highest bid, and for every bid in SkatZero's list the
   pick-up value and the seven Hand values (penalty-free), enough to decide pick-up/Hand at any
   winning bid by lookup.
4. **In play** (new `computer = skatzero@1fe5cab`):
   - the auction is a lookup against the stored highest bid (bid next/hold if ≤ it, else pass);
   - after winning, pick-up or Hand is a lookup at the winning bid;
   - after picking up, discard and game come from `find_best_game_and_discard` on the twelve cards
     plus the table at the winning bid (≈ 7 runs, live);
   - card play is SKATGO-38's. Every move is recorded and replayed as recorded.
5. **Preparation**: the service deals today and tomorrow ahead (at start and hourly), computing in
   short slices that yield to the event loop; a day that is not ready answers "preparing".

## Redline lookup

| Action | Entry | Result |
|---|---|---|
| Commit 8 `.npy` tables (1.1 MB, MIT) | — | within the approved SkatZero integration |
| New dependency | engineering.md R3 | none (own `.npy` reader) |
| Production schema | operations.md R5 | none if the tables live inside `daily_deals.deals` JSON (grill Q1) |
| Plan starter → standard | operations.md R5 | measured locally, asked at deploy |

## Grill outcome

Settled 2026-10-02 (`grill.md`, self-adjudicated under the human's authorization; no redline
approval needed). Folded in:
- Q1 conditions: only today's deals ever leave the service, and no route can read tomorrow's;
  preparation runs only on the fenced leader, with idempotent inserts; `/readyz` never waits for
  preparation.
- Q3: the opponents' bid features stay zero in bidding **and** in card play (revising SKATGO-38's
  expectation); upstream penalties kept.
- Q9: the handoff records a day's preparation time (local), an estimate for Render starter, and
  memory while preparing versus SKATGO-38's peak.
