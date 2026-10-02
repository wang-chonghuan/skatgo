# SKATGO-38 handoff

## What changed

**Models — `multiplayer/skatzero/`**
- The nine ONNX models from SkatZero `1fe5cabbd5f9c3e77ab51714b0ac702e5a71e53b` are committed under
  `models/` (54,285,308 bytes in all; grill Q2).
- `manifest.json` records the source repo, commit, names, sizes and SHA-256; each hash was checked
  against SKATGO-22's `provenance.json` before writing.
- The upstream MIT `LICENSE` is copied unchanged. Upstream's own file still carries the template line
  "Copyright (c) [year] [fullname]".

**Encoder and policy — `multiplayer/src/skatzero/`**
- `encode.ts` is a literal port of `skatzero/env/feature_transformations.py`:
  - both suit-normalisation layers (trump ↔ D; the per-state suit order D,H,S,C stable sort; fixed
    Jacks except in Null);
  - relative seats and `process_action_seq`;
  - `calculate_missing_cards`, including its carried-over last card;
  - points, and the four role layouts (555/573/314/364);
  - the legal candidates in hand order.

  The bidding features are zero, with `bid_jacks` as a one-hot of 0 (grill Q5).
- `policy.ts`:
  - `verifyModels`: manifest, size and SHA-256 of all nine.
  - `loadPolicy`: nine resident single-threaded sessions, I/O names checked, each warmed;
    `ORT_DISABLE_TELEMETRY` is set before the library loads.
  - `viewOf(g, seat)`: what the seat may see — own hand, played cards, the skat only for the declarer
    who picked it up, a Null Ouvert declarer's current cards.
  - `toZ`: the view in SkatZero's names, with the colour swap.
  - `choose`: the measured driver's procedure — net values, the one-step lookahead on the third card
    of a non-Null trick (trick winner and points from the product engine), first maximum. Shapes,
    finiteness and legality are asserted, and any failure throws.

**Tournament — `multiplayer/src/daily.ts`, `store.ts`, `server.ts`**
- Storage: `daily_deals.computer` is a new column (`NOT NULL DEFAULT 'heuristic'`). New days are dealt
  with `skatzero-play@1fe5cab+heuristic-bid`.
- Recorded days store each deal as the ordered `{seat, move}` list. A computer declarer's skat step is
  recorded as three moves: pickup, discard, declare.
  - `replayLog` replays the recorded moves through the engine and collects tricks by rule; it never asks
    a computer.
  - `advance` asks the computer whose turn it is: bidding and the skat step from the heuristics, cards
    from SkatZero, with a 2 s limit per decision. It validates each move with `applySeatMove`, records it
    and returns the steps for the table.
  - `settleRecorded` also plays a new deal's opening computer bids and records them.
- `heuristic` days keep their old shape and code path (`replay`/`untilPlayer`) unchanged.
- A failed decision raises `ComputerFailed`: the transaction rolls back and the request answers
  `503 {error:'computer_unavailable'}` (logged as `daily_computer_failed`). Nothing heuristic is played
  in its place.
- `server.ts` loads the policy at start. `/readyz` and `ready` wait for it, and a load failure logs
  `skatzero_failed` and exits 1. The sessions are released on shutdown.

**Build and dependency**
- `onnxruntime-node` 1.30.0, pinned exactly (approved on the ticket). Its install script, which only
  fetches CUDA, is not run; the CPU binaries ship inside the package.
- `multiplayer/Dockerfile`:
  - `node:24-slim` in both stages (grill Q1: alpine/musl cannot load the library — probed);
  - the committed models are copied into the image;
  - `ENV ORT_DISABLE_TELEMETRY=1`;
  - onnxruntime's win32/darwin binaries are removed (935 MB → 620 MB image).

**Tests:** `multiplayer/test/skatzero.test.ts`
- the hashes match the manifest, and an altered model is refused;
- 62 fixture states (`test/fixtures/skatzero-parity.json`, cut from the Python oracle run) equal the
  reference in obs, history, values and choice.

**Charter (authorized):**
- `engineering.md`: Stack (SkatZero card play, models, dependency, hybrid, multiplayer only), Key
  decisions (a computer is asked once per move and the answer kept; no stand-in), Tools (what the check
  now includes), hotspots (encoder parity; replay on recorded days).
- `operations.md`: readiness waits for the models; the image is slim and carries the models; nothing
  is downloaded; telemetry is off.
- `multiplayer/README.md` gains a SkatZero section.

## AC results

Local only: multiplayer 56038, PostgreSQL 57038, web 55038. The oracle is SkatZero's own Python driver
(`skat-ai/tools/skatzero-bot.py`, as measured in SKATGO-22) on its pinned source. Scripts are in `tmp/`.
No gameplay in the browser; one smoke check only.

1. **Every computer card on a switched day is SkatZero's, legal and the same for everyone — PASS.**
   - The day dealt by the new code is labelled `skatzero-play@1fe5cab+heuristic-bid`.
   - Players A and B played the whole day through the web API in **1.9 s**, and their stored move logs
     are identical.
   - All 541 recorded moves replay legally through the engine.
   - Each of the **240** computer card plays, rebuilt from the log as that seat's visible state, equals
     the card SkatZero's Python driver picks for the same state (240/240). The driver's own card-point
     bookkeeping agrees with the port in every state.
   - Fault paths:
     - with an altered `N_2.onnx` the service exits at start (`skatzero_model_altered N_2`, exit 1)
       and is never ready;
     - with inference made to fail (acceptance-only preload, `tmp/fail-run.mjs`), the move that needs
       a computer card answers `503 computer_unavailable`, the entry is byte-identical before and
       after, and no card is played in its place.
2. **Encoder and model output equal the Python reference — PASS.**
   - **Runtime:** SKATGO-22's nine saved feeds through the committed models give max error **0**, the
     same argmax and the same shapes.
   - **Encoder and policy:** **6,603** states from 300 seeded engine games:
     - forced contracts: every trump suit, Grand, Null; 2,409 Hand-game states, 513 Null Ouvert
       states;
     - all 27 cells of game type × seat × trick position are covered, the smallest with 39 states;
     - result: obs, history and actions equal element for element, values with max error **0**,
       choices identical;
     - the lookahead applied in 1,701 states and changed the choice in 120, all identical.
3. **Reload/continue never changes a computer card; old days unchanged — PASS.**
   - The merged pre-SkatZero code (`origin/main`, built in `tmp/old`), with the clock on yesterday,
     created a finished day (H) and an unfinished one (K).
   - On the same data, the new code:
     - marks that day `computer=heuristic`;
     - leaves its deals and both entries byte-identical;
     - returns K's state view, revision and status equal to the old code's;
     - returns H's 12 scores and total unchanged;
     - plays K on to the end.
   - On a recorded day, two reloads mid-deal return the same view with the stored moves unchanged.
     Continuing only appends, and every earlier recorded move is untouched.
4. **Latency and memory — PASS.** Built image, local Colima VM (**arm64**; Render runs x64):
   - 2,010 decisions inside the image (encode + inference + lookahead): **p50 0.302 ms, p95 0.923 ms**,
     p99 2.09 ms, max 3.49 ms. The 50 ms bound holds with a wide margin.
   - Server container:
     - ready right after start, models loaded in about 80 ms;
     - process RSS after loading 251 MB;
     - cgroup memory 180 MiB idle, **peak 259.5 MiB** while playing 36 whole days (12 then 24
       concurrently, 3.3 s and 5.9 s; all equal totals).
   - Headroom against Render starter's 512 MB is about **250 MB**, so not flagged. These figures are
     local arm64 measurements; production x64 should be read after deploy.

Browser smoke (1280×820): on the recorded day `/en/daily/play` opens, deals 10 cards and accepts a
move (200), with no page errors.

**Mechanical defence** (`engineering.md` Tools): PASS — app typecheck, build, 75 tests, client bundle
(no onnxruntime in the browser build), design tokens, literal grep, SSR link.
`npm --prefix multiplayer run check`: **15/15** (12 room tests, 3 SkatZero tests).

**Left to the human's own testing:** playing tournament deals against the new computers, and how they
feel.

## Deviations

- **Null Ouvert:** the declarer's open cards are its *current* cards, as SkatZero's training env
  (`game/round.py`) and the product table show them. The SKATGO-22 arena driver passed the original
  ten. Parity was checked with the current cards fed to the Python driver.
- **AC3 wording:** I had written "policy not called on reload (call counter)". It is shown instead by
  construction (`replayLog` takes no policy) and by the stored logs and views being unchanged across
  reloads. No product hook was added.
- **Image size:** removing onnxruntime's Windows and macOS binaries in the build stage was not in the
  plan; it saves about 315 MB of image.
- Proposed solution: followed. The models are committed rather than fetched (grill Q2), and `/readyz`
  waits for them (grill Q6).

## Environment

- Ports: web **55038**, multiplayer **56038**, database **57038** (running for review).
- Product env keys: **none** added, changed or removed. The worktree's `app/.env` and
  `multiplayer/.env` point at the ticket ports, ticket-local only.
- At deploy (grill Q1, approved by the human):
  - `multiplayer` image base becomes `node:24-slim`;
  - `migrate()` adds `daily_deals.computer`; existing days become `heuristic`.
  - The first day dealt after the deploy plays SkatZero (grill Q4). Deploy multiplayer only; web is
    unchanged.
  - The plan stays starter unless production memory says otherwise.
- The local Docker image `skatgo-multiplayer:skatgo-38` is left in Colima for review.

## Residual

- SKATGO-39: port SkatZero's bidding (Bidder + tables) and turn the bid features on with parity.
- SKATGO-37 can now replay any recorded day's deals move by move from `daily_entries.actions`.
- `operations.md`'s post-deploy check is still stale (localized paths, `/` → 302), as reported at
  SKATGO-36's deploy; it needs a human-owned fix.
