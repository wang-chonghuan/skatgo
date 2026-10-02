# SKATGO-39 grill

Mode: `Grill: human` when the batch was written; the human then authorized self-adjudication for this
ticket (2026-10-02, 「回答工单39的grill问题」; the ticket's Grill row is now `self`). Answers below are
recorded by the pm session under that authority, from the Charter and observation. No question needs a
Redline approval: no production schema change, no dependency, no env key. Reviewed: live SKATGO-39; SkatZero `api.py` (BID, SKAT_OR_HAND_DECL,
DISCARD_AND_DECL, get_max_bid), `bidding/bidder.py`, `bidding/bidder_simulated_data.py`,
`skatzero/game/utils.py` (calculate_max_bids); SKATGO-22 `rework.md` §8; merged SKATGO-38
(`multiplayer/src/daily.ts`, `src/skatzero/*`). Measured: one ONNX run with 66 candidates ≈ 0.7 ms
in Node → one computer's bidding evaluation ≈ 1.1 s, a day ≈ 25–30 s here.

## Batch 1 (2026-10-02)

### Q1. When and where the bidding is computed

One evaluation per computer per deal is ~1 s (here; slower on Render); a day ~0.5–2 min of CPU.

- **Recommended**: the service deals **today and tomorrow ahead** — at start and then hourly — and
  computes both computers' bidding for all 12 deals in short slices that yield to the event loop
  (rooms, health checks and players stay responsive; no second set of models in memory). The results
  are stored inside the day's `daily_deals.deals` JSON, so **no schema change**. If a day is somehow
  not ready when asked (e.g. the service was down at midnight), the request answers "preparing" and
  the page's existing "try again" covers it; preparation continues in the background.
- **Alternatives**: compute each deal when first opened (the first player of each deal waits ~2–5 s);
  or a worker thread (needs its own nine sessions, ≈ +150 MB against the 512 MB plan).
- **Decision** (pm, self-adjudicated): **accepted**, with three conditions:
  - Only today's deals ever leave the service. Tomorrow's are stored but never readable through any
    route.
  - Preparation runs only on the fenced leader. Inserts stay idempotent (`ON CONFLICT DO NOTHING`).
  - Preparation never delays `/readyz`; the service is ready and serves while it computes.
  Basis: the measured cost (≈ 1.1 s per computer per deal, a day ≈ 25–30 s locally) cannot sit in a
  request. A worker thread would add a second set of models (≈ +150 MB) to the 512 MB plan. No schema
  change keeps the deploy free of a Redline 5 approval.

### Q2. What "17" means

`get_max_bid` returns 17 when the hand is just short of 18.

- **Recommended**: 17 = **pass everywhere** — the computer never says, holds or takes 18 with it.
- **Alternative**: 17 = never bid actively, but take the game at 18 as forehand when both others
  passed.
- **Decision** (pm, self-adjudicated): **accepted — 17 = pass everywhere.** Observed in `api.py`:
  `get_max_bid` returns 17 only when the 18 value lies within 5 points *below* the threshold. No
  upstream consumer gives 17 another meaning; it is only printed. By the model's own measure, 18 is not
  worth playing.

### Q3. What the bidding sees of the others

Upstream's `SKAT_OR_HAND_DECL` and `DISCARD_AND_DECL` read the opponents' bids as features
(`parse_bid`); `BID` does not.

- **Recommended**: zero those features everywhere, as SKATGO-38 does for card play. Then everything
  except the final discard/game is known at deal time (Q1), and the same deal gives the same computer
  decisions whatever the human bid (the AC4 premise). Penalties stay upstream's: `BID` with
  D 15 / G 40 / DH 30 / GH 60, pick-up/Hand and declaration without.
- **Alternative**: feed the real auction, computed live when a computer wins (~1–5 s per such deal).
- **Decision** (pm, self-adjudicated): **accepted — opponents' bid features stay zero, in bidding and
  in card play.** This revises SKATGO-38 grill Q5, which expected this ticket to turn them on for card
  play: only the zeroed configuration has measured strength (SKATGO-22). Zero features also keep the
  ahead-of-time tables valid and decisions identical for everyone. Feeding the real auction is a
  possible later improvement that needs its own measurement, not this ticket. Upstream's penalties are
  kept.

### Q4. A winning bid that is not in SkatZero's list

Its list stops at 168 and lacks e.g. 117 or 130; a computer wins at such a value only if a human bid
it and the computer held.

- **Recommended**: decide pick-up/Hand and the game with the values of the **next higher** list bid
  (the conservative side). The highest bid itself is always a list value, so a computer never offers an
  off-list number.
- **Decision** (pm, self-adjudicated): **accepted** — an off-list winning bid uses the next higher
  list bid's values; the computer's own offers are always list values.

### Q5. Determinism and limits

- **Recommended**: the 231 skats are always all tried (no 60-second early stop, which would make the
  result depend on machine speed), in an order seeded from the deal, and the result is stored — so it
  is the same for everyone and on replay. A total limit per day's preparation (10 minutes) fails the
  preparation for a retry; nothing falls back to the heuristics. Parity checks hand Python the same
  order.
- **Decision** (pm, self-adjudicated): **accepted**:
  - all 231 skats, in an order seeded from the deal, with no time-based early stop;
  - results stored;
  - a 10-minute limit per day's preparation, failing it for a retry;
  - no heuristic fallback (ticket constraints: deterministic, cancellable, no mislabelled fallback).

### Q6. Declarations SkatZero makes

- **Recommended**: accept its range — after picking up: any suit, Grand, Null, Null Ouvert; Hand:
  suit/Grand Hand, Null Hand, Null Ouvert Hand. It never announces Schneider, Schwarz or Ouvert on a
  suit or Grand; neither does the computer.
- **Decision** (pm, self-adjudicated): **accepted** — SkatZero's declaration range as upstream; no
  Schneider/Schwarz/Ouvert announcements on suit or Grand. Every declaration still passes the engine.

### Q7. The switch and the label

- **Recommended**: new days are dealt as `skatzero@1fe5cab` (bidding and play). Days already dealt —
  `heuristic` and `skatzero-play@1fe5cab+heuristic-bid` — stay as they are. As before, the first day
  dealt after the deploy switches; since days are now dealt a day ahead, that is the first day the new
  service deals.
- **Decision** (pm, self-adjudicated): **accepted** — `skatzero@1fe5cab` for days the new service
  deals. Days already dealt keep their label and replay as recorded.

### Q8. Tables in the repository

- **Recommended**: commit the eight `.npy` files (1.1 MB) with their hashes in the manifest and read
  them in Node directly — exact float64 values, no conversion step, no Python, no new dependency.
- **Decision** (pm, self-adjudicated): **accepted** — commit the eight `.npy` files with hashes in the
  manifest, verified like the models (SKATGO-38 grill Q2). A small own reader, no dependency.

### Q9. How acceptance proves it

- **Recommended**: as `ac.md` — Python's own `Bidder` with the same skat order and zero bid features as
  the oracle: ≥ 150 highest bids over the three positions, pick-up/Hand at every winning bid up to each
  hand's highest, ≥ 300 discard/game choices; every mismatch reported with its cause (float32
  rounding near a threshold is possible; reported, not hidden). Bid-answer latency from the act
  requests; whole days via the API, not the browser.
- **Decision** (pm, self-adjudicated): **accepted**, plus:
  - The API-driven day stays under a minute; no deal is played in the browser.
  - The handoff records a day's preparation time (local), an estimate for Render starter's CPU, and
    process memory with preparation running versus SKATGO-38's peak.

## Outcome

All nine resolved, self-adjudicated under the human's authorization; no Redline approval was needed.
Fold into `plan.md` / `ac.md`:
- **Q1 conditions**:
  - tomorrow is never served (add a check: no route returns a not-yet-current day's cards);
  - leader-only preparation;
  - readiness independent of preparation.
- **Q3**: card play's bid features stay zero, revising the SKATGO-38 expectation.
- **Q9**: preparation time, CPU estimate and memory go into the handoff.

