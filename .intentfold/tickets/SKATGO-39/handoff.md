# SKATGO-39 handoff

## What changed

**Bidding port — `multiplayer/src/skatzero/`**
- `bidding.ts` is a literal port of SkatZero `1fe5cab`'s bidding:
  - `SimulatedDataBidder`: bid list, `get_bid_value_table` with Schneider/Schwarz/lost and the Null
    limits, penalties;
  - `calculate_max_bids`;
  - `Bidder`: `prepare_state` colour swaps; `simulate_player_discards` / `get_blind_hand_values`
    (forehand: own lead; middlehand: mean of the 5 worst opponent leads; rearhand: mean of the 10
    best); `get_blind_hand_bidding_table`; `find_best_game_and_discard`, including its "performance
    hotfix"; `update_value_estimates`;
  - `api.py`'s `get_max_bid` and `declare`.

  Numpy's float32 is emulated with `Math.fround` where upstream keeps float32 (net values and their
  sums). Upstream quirks are kept for parity — e.g. Hand tables of a suit game count matadors on the
  colour-swapped hand.
  - `seatBidding` produces BID (with upstream penalties D 15 / G 40 / DH 30 / GH 60) and the
    penalty-free SKAT_OR_HAND tables from **one** simulation; the net's values do not depend on
    penalties.
  - `skatOrHand(bid)` is a lookup; an off-list winning bid uses the next higher list bid (grill Q4).
  - `declareAfterPickup` is DISCARD_AND_DECL live (7 model runs of 66 candidates).
- `tables.ts`: a small `.npy` reader. It checks the eight tables against the manifest (size,
  SHA-256), averages the distributions over the 200 simulated hands as numpy does (running sum, then
  one division), and pads both ends with the extreme rows. `interp` follows numpy's rules (clamped
  ends, exact knots).
- `encode.ts`: the discard state (`drueck` flag plus the `pos` one-hot) and the 66 two-card candidates
  of a twelve-card hand.
- `policy.ts`: `score` (raw declarer-model values for a state) and the loaded `tables`.
- `multiplayer/skatzero/bidding/`: the eight `.npy` files (730,928 bytes, MIT), hashes in
  `manifest.json` (checked against SKATGO-22's `provenance.json`).

**Tournament — `multiplayer/src/daily.ts`, `server.ts`**
- New label `skatzero@1fe5cab` for days the new code deals. `skatzero-play@1fe5cab+heuristic-bid`
  (SKATGO-38) and `heuristic` days are unchanged.
- **Days are dealt ahead** (grill Q1):
  - `prepareDays` runs on the leader only, after it is ready, then hourly; one preparation at a time.
  - It deals today and tomorrow and works out both computers' bidding for all 12 deals. Each run
    tries all 231 skats, in an order fixed by day, deal and seat (`skatOrder`), with no time-based
    stop (grill Q5).
  - It stores each computer's `{maxBid, pickup, hand}` inside the deal in `daily_deals.deals`, so
    there is **no schema change**, then inserts idempotently. It yields between steps and has a
    10-minute limit per day.
- **Requests never deal.** A day not yet there answers `503 day_preparing` and starts the
  preparation. Only today is ever read by a route.
- In play on a `skatzero@` day:
  - The auction is a lookup against the stored highest bid: bid the next value / hold while it is
    within the highest bid, else pass; 17 and 0 are pass everywhere (grill Q2).
  - Pick-up or Hand is a lookup at the winning bid. A Hand game is recorded as `hand` + `declare`.
  - After a pick-up, `pickup` + `discard` + `declare` from DISCARD_AND_DECL, with the same 2 s limit
    and no fallback.
  - Cards are SKATGO-38's. Declarations follow SkatZero's range, with no Schneider/Schwarz/Ouvert
    announcements on suit or Grand (grill Q6).
- The opponents' bid features stay zero in bidding and card play (grill Q3).

**Tests:** `multiplayer/test/skatzero.test.ts` gains:
- the bidding table hashes, and refusal of an altered table;
- 6 hands (highest bids 0 / 17 / 33 / 59 / 60 / 72 over the three positions, including Hand choices)
  and 21 discard/game cases (3 per game type), expected from SkatZero's Python. Decisions must be
  exact; tables are allowed 1e-3, see Deviations.

**Charter (authorized):**
- `engineering.md`: Stack (SkatZero bidding; labels; zero bid features) and Key decision (a day's
  bidding is worked out when dealt; requests never deal; only today is read).
- `operations.md`: preparation on the leader, its logs and timing, the 10-minute limit, readiness not
  waiting, `503 day_preparing`.
- `multiplayer/README.md`: bidding section and the parity-refresh procedure.

## AC results

Local: web 55039, multiplayer 56039 (built image `skatgo-multiplayer:skatgo-39` in Colima for the
memory and preparation runs), PostgreSQL 57039. Oracle: SkatZero's own `Bidder` and `api.py`
functions (`tmp/oracle_bid.py`; `api.py`'s torch-only loader module stubbed), with the ONNX agents of
the measured driver, the same skat order and zero bid features. No gameplay in the browser.

1. **From the switch day, every computer bid, pick-up/Hand, discard and game is SkatZero's, and legal
   — PASS.**
   - Today was dealt as `skatzero@1fe5cab`. A and B played the whole day through the API in
     **3.2 s**, and their logs are identical.
   - All recorded moves replay legally: 67 computer bids, 9 pick-ups, 9 discards, 9 declarations,
     220 cards. Every computer bid and pick-up/Hand follows the bidding stored with its deal.
   - **9/9** live discard/game choices equal Python `DISCARD_AND_DECL`.
   - The day's **24** stored computer biddings against Python BID / SKAT_OR_HAND_DECL: highest bid
     **24/24**, skat/Hand at every winning bid **140/140**.
   - Old days: a day dealt by SKATGO-38's merged code (H finished, K unfinished; clock on yesterday)
     reads back byte-identical under the new code. K plays on to the end and only appends; its
     computers bid with the heuristics, as that day's label says (58/58 bids equal `aiBid`).
2. **TS equals Python — PASS.** Mismatches: **none**.
   - **Highest bid and skat/Hand:** 150 seeded hands over the three positions, 885 decisions (150
     highest bids plus 735 skat/Hand choices, one at every winning bid from 18 to each hand's
     highest).
     - The hand values are identical, and the tables are within **1.8e-12** (summation order).
     - Highest bids covered: 0 (64), 17 (4), 18–27 (49), 30–48 (20), > 48 (13).
     - Choices covered: pick-up 530, CH 10, SH 34, HH 5, DH 9, GH 123, NOH 24. **Null Hand (NH)
       never came up**: covered by the code path, not by an observed sample.
   - **Discard and game:** 300 twelve-card hands at random winning bids, all identical, covering all
     seven game types (G 80, C 69, S 40, H 36, N 33, D 23, NO 19).
3. **Bidding answers without simulating — PASS.** The 76 auction requests in which computers answered
   took **p50 7.5 ms, p95 33.6 ms**, max 58.8 ms (client → web → containerised multiplayer). Play reads
   the stored tables and never simulates.
4. **Same decisions for everyone — PASS.**
   - A's and B's logs are identical.
   - In the service's own image (Linux arm64), the day's 24 stored biddings recompute **24/24
     identical**.
   - macOS vs Linux model outputs differ in the 6th significant digit (e.g. 40.850706 vs 40.850705).
     That is why the bidding is computed once and stored. Decisions agreed in every case above
     (Linux-stored vs macOS Python: max table difference 3.0e-5, no decision changed).

Grill additions — PASS:
- tomorrow (2026-10-03) is prepared in the DB, and today's `state` answer carries one of today's dealt
  hands and none of tomorrow's;
- `/readyz` was 200 while today was still being prepared (state answered `503 day_preparing`);
- preparation runs only after leadership.

**Preparation time and memory** (grill Q9):

| | per day (24 computer biddings) | memory |
|---|---|---|
| macOS (M-series, native) | 41–42 s | RSS up to ~475 MB (macOS accounting) |
| Linux container (arm64 VM) | 88–95 s with the Python oracle running alongside; 89–92 s alone | cgroup **peak 275.7 MiB**; process RSS ~350 MB |

- SKATGO-38's container peak was 259.5 MiB, so preparing adds about 16 MiB. Headroom against
  Render starter's 512 MB is about **236 MB**; not flagged.
- Render starter estimate: a fraction of one x64 vCPU, so expect **~3–6 min per day**. That is
  inside the 10-minute limit, but tighter. At deploy, read `daily_prepared`'s `ms` in the logs. If it
  nears the limit, a CPU upgrade is a human decision (Redline 5).

**Mechanical defence:** PASS — app typecheck, build, 75 tests, bundle, tokens, literal grep, SSR link.
`npm --prefix multiplayer run check`: **17/17**.

**Left to the human's own testing:** playing against the new computers' bidding and declarations.

## Deviations

- **The computer's offers can be an off-list value.** The product's auction has the speaker name the
  next ladder value, so a computer whose highest bid is, say, 120 will say 117 after 110. The decision
  ("is the next value within my highest bid?") is SkatZero's; the number said is the product's
  ladder. This corrects grill Q4's line "the computer's own offers are always list values".
- **Committed fixture tolerance:** tables are compared within 1e-3, because the fixture's
  expectations come from Python on macOS and the test may run elsewhere. Decisions are exact. The
  parity runs above used exact comparison: macOS vs macOS, max difference 1.8e-12.
- Grill Q1's "preparing" path: the page shows its existing "can't be reached right now / try again"
  for `503 day_preparing`. No new UI.
- The `mem.mts` finding that macOS RSS overstates memory (~450 MB) against the container's cgroup
  (~276 MiB) is recorded here so nobody sizes the plan from a laptop.

## Environment

- Ports: web **55039**, multiplayer **56039**, database **57039** (running for review).
- Product env keys: **none** changed. The worktree's `.env` files point at the ticket ports
  (ticket-local).
- At deploy:
  - no schema change, no env change, no new dependency;
  - deploy multiplayer only;
  - after deploy, the leader prepares today and tomorrow. If today was already dealt by the old code,
    today keeps its label and tomorrow is the first `skatzero@` day;
  - expect a few minutes of CPU per day on starter.
- Local Docker image `skatgo-multiplayer:skatgo-39` left in Colima for review.

## Residual

- SKATGO-37 can replay recorded days, now including the computers' bids and declarations.
- Free play and lesson 11 still use the heuristics; that is the third ticket of the plan.
- Feeding the real auction to the models is a possible later improvement, needing its own
  measurement (grill Q3).
- `operations.md`'s post-deploy check is still stale (localized paths, `/` → 302), as reported
  earlier.
