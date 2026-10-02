# SKATGO-38 grill

Mode: `Grill: human` when the batch was written; the human then authorized self-adjudication for this
ticket (2026-10-02, 「回答38的grill问题」; the ticket's Grill row is now `self`). Answers below are recorded
by the pm session under that authority, from the Charter and observation; a Redline approval stays the
human's. Reviewed: live SKATGO-38; SKATGO-22 `rework.md` (integration guide),
`provenance.json`; the local reference at `.intentfold/tmp/SKATGO-22/benchmark/`; `multiplayer/src/*`
(35/36 tournament), `multiplayer/Dockerfile`; the Charter. Probed: onnxruntime-node 1.30.0 on
`node:24-alpine` (fails, musl) and `node:24-slim` (works).

## Batch 1 (2026-10-02)

### Q1. Production changes that need your approval (operations.md Redline 5)

- (a) **`multiplayer/Dockerfile` base image `node:24-alpine` → `node:24-slim`**: onnxruntime-node's
  native library does not load on alpine (probed). The image grows (Debian slim + ~52 MB models +
  onnxruntime ≈ 100 MB more).
- (b) **Production schema**: `daily_deals` gains `computer text` (existing days set to `heuristic`).
  Entries of new days store the full move list in the existing `actions` column.
- Both take effect only at deploy. A plan upgrade (starter → standard) is **not** asked now: measured
  locally first, asked at deploy if needed (ticket constraint).
- **Recommended**: approve (a) and (b).
- **Decision** (the human, 2026-10-02, asked by the pm session): **approved both**:
  - (a) `multiplayer/Dockerfile` base `node:24-alpine` → `node:24-slim`.
  - (b) `daily_deals.computer` in production; existing days are `heuristic`.
  Both take effect at deploy, after the human says to merge and deploy. A plan upgrade stays a
  deploy-time question after the local measurement. Recorded as a ticket comment.

### Q2. How the 52 MB of models reach the image

- **Recommended**: commit only a manifest (repo, commit, names, sizes, SHA-256) and SkatZero's MIT
  `LICENSE`; a script downloads the nine files from the pinned commit's raw GitHub URLs at **Docker
  build** time (and once locally into a git-ignored folder), verifying every hash — a mismatch or an
  unreachable GitHub fails the build, never the running service.
- **Alternative**: commit the 52 MB into the repository (no network at build; the history keeps the
  weight forever).
- **Decision** (pm, self-adjudicated): **the alternative — commit the nine models** (with the manifest:
  source repo, commit, names, sizes and SHA-256, plus SkatZero's MIT `LICENSE`). Keep the hash check:
  a test and the service's startup verify every file against the manifest.
  - Upstream is rarely maintained: the pinned commit is from 2025-06-19 (`provenance.json`). If that
    repository disappeared or were rewritten, every later multiplayer deploy would fail, probably when
    a fix is urgent.
  - Each file is 5.6–6.2 MB, far below GitHub's per-file limits, about 52 MB once.
  - The repository is public, and MIT allows redistribution with the licence.
  - A hermetic build does not depend on GitHub raw at deploy time. No fetch script is needed.

### Q3. The tournament computer for now is a declared hybrid

- **Recommended**: card play = SkatZero; bidding, pickup/Hand, discard and declaration = the existing
  heuristics, recorded as their real moves. The day's computer is labelled
  `skatzero-play@1fe5cab+heuristic-bid` — never "SkatZero" alone — until SKATGO-39 replaces the
  bidding.
- **Decision** (pm, self-adjudicated): **accepted** — the hybrid is declared and labelled
  `skatzero-play@1fe5cab+heuristic-bid` until SKATGO-39; never "SkatZero" alone. Matches the ticket's
  Scope (bidding stays on the heuristics) and its no-mislabelling constraint.

### Q4. When the switch takes effect

- **Recommended**: the first day **dealt** after the deploy. Days are dealt at their first request; if
  the deploy lands mid-day, that day's deals already exist with `heuristic` and stay so — everyone that
  day meets the same computer — and the next Berlin midnight starts SkatZero.
- **Decision** (pm, self-adjudicated): **accepted** — the first day dealt after the deploy. A day
  already dealt stays `heuristic`, so everyone that day meets the same computer (ticket Scope).

### Q5. The bidding features the model reads

SkatZero's encoder has bid features (`parse_bid`: what each player's bidding suggests). The measured
configuration in SKATGO-22 zeroed them (fixed contracts), and the port of `parse_bid` was never
validated against real bidding.

- **Recommended**: zero them in this ticket, exactly as measured; SKATGO-39, which ports the bidding,
  turns them on with its own parity fixtures.
- **Alternative**: port `parse_bid` now and feed the heuristics' auction (unmeasured, more parity work).
- **Decision** (pm, self-adjudicated): **accepted** — bid features zeroed, exactly as measured in
  SKATGO-22; SKATGO-39 turns them on with its own parity fixtures. Basis: only the measured
  configuration has evidence behind it.

### Q6. When the model is computed, and what happens if it fails

- **Recommended**: inside the player's move request, as the heuristics are now (each decision ≈ 1 ms;
  the whole computer reply to one move is a handful of decisions), holding only that player's entry
  row. A per-decision limit of 2 s. Any failure (load, NaN, shape, illegal, timeout) rolls the move
  back and answers an error the page shows as "the tournament can't be reached right now"; nothing is
  stored, and **no heuristic card is ever played in its place**. The service refuses to start with a
  missing or altered model.
- **Decision** (pm, self-adjudicated): **accepted**, plus: `/readyz` stays false until the nine
  sessions are loaded, verified and warmed, so Render routes no traffic before the computer exists
  (observed: `server.ts` already gates `/readyz` on `ready`). No heuristic fallback, per the ticket's
  constraint.

### Q7. The policy is the measured one, lookahead included

- **Recommended**: port the driver's one-step lookahead (third card of a non-Null trick; own winning
  candidates re-valued from the next lead, using only the seat's own hand and public cards) — without
  it the strategy is not the one measured. Ties pick the first legal candidate in a fixed card order,
  so two players in the same position get the same card.
- **Decision** (pm, self-adjudicated): **accepted** — port the measured one-step lookahead; ties
  break by a fixed card order. Basis: AC1 requires the same card for everyone in the same position, and
  only the measured policy has evidence.

### Q8. Charter lines

- **Recommended**: `engineering.md` — Stack (onnxruntime-node and the pinned models in multiplayer
  only), Structure (`multiplayer/src/skatzero/`, `multiplayer/skatzero/`), Key decision (tournament
  computers are recorded, not recomputed; no fallback), Tools (the fetch script, the parity test);
  `operations.md` — the multiplayer build fetches and verifies models, the image base. Covered by the
  human's 「授权你改charter」 for the tournament, confirmed here.
- **Decision** (pm, self-adjudicated): **accepted**, adjusted to Q2: no fetch script; the Tools line
  names the model-hash test instead. This is the tournament's computer, covered by the human's
  「授权你改charter」 (2026-10-01).

### Q9. How acceptance proves parity and speed

- **Recommended**: as `ac.md` — parity against the local Python reference on ≥ 300 states sampled
  from engine games (all contract types, roles and trick positions), a committed compact subset as a
  multiplayer test; latency and memory measured in the built `node:24-slim` image locally, ≥ 1,000
  decisions. Whole days via the API, not the browser.
- **Decision** (pm, self-adjudicated): **accepted**, keeping the human's acceptance limits (SKATGO-35
  grill Q10).
  - The API-driven whole-day run finishes in under a minute; no deal is played in the browser.
  - Offline parity generation is not part of that minute.
  - Record peak RSS against Render starter's 512 MB. If it leaves less than about 100 MB of headroom,
    the handoff says so, for the deploy-time plan question.

## Outcome

All nine resolved (Q1 by the human, Q2–Q9 self-adjudicated under the human's authorization). Fold
into `plan.md` / `ac.md`:
- **Q2**: commit the nine models + manifest + LICENSE instead of fetching at build. Drop the fetch
  script, and verify the hashes in a test and at startup.
- **Q6**: `/readyz` waits for the loaded and warmed sessions.
- **Q9**: the API run stays under a minute, and the handoff records RSS headroom against 512 MB.

