# SKATGO-38 plan

## What the code and the environment already say that the ticket does not

- **The tournament's computers are re-derived on every request.** SKATGO-35 stores only the human's
  moves (`daily_entries.actions: Move[][]`) and replays deck + human moves through the deterministic
  heuristics (`computerMove` in `multiplayer/src/model.ts`). The moment the computer is a model, that
  replay is no longer "the same game": every computer decision must be stored and replayed as data.
- **`onnxruntime-node` does not load on the multiplayer image's base.** Probed 2026-10-02 in Colima:
  `node:24-alpine` → `ERR_DLOPEN_FAILED` (musl); `node:24-slim` → loads `D_0.onnx` and runs a batch,
  ~83 MB RSS with one model. The `multiplayer/Dockerfile` base must change (operations.md Redline 5).
- **The models are 52 MB** (nine `.onnx`, hashes in `.intentfold/tickets/SKATGO-22/provenance.json`),
  MIT-licensed, at SkatZero `1fe5cabbd5f9c3e77ab51714b0ac702e5a71e53b`. The image copies only
  `multiplayer/` and `app/src/lib/skat/`.
- **The Python reference still runs locally** (`.intentfold/tmp/SKATGO-22/benchmark/`: SkatZero source
  at the pinned commit, `runtime/venv` with numpy 2.5.3 / onnxruntime 1.30.0, the arena driver
  `skat-ai/tools/skatzero-bot.py`). The saved golden file holds nine opening **tensors** only, not the
  states behind them: encoder parity needs new fixtures generated from states by the Python reference.
- **onnxruntime-node logs a telemetry initialisation** ("telemetry HTTPS uploads"): production must not
  phone home; it is switched off where the session is created.
- Rooms (`room.ts`), free play, lessons and hints are out of scope and stay on the heuristics.

## Route

1. **Model assets** (`multiplayer/skatzero/`): the nine `.onnx` files **committed** (grill Q2), with
   `manifest.json` (source repo, commit, file names, sizes, SHA-256) and the upstream MIT `LICENSE`.
   Hashes are verified by a multiplayer test and again at service startup; nothing is downloaded at
   build or run time.
2. **Encoder** (`multiplayer/src/skatzero/encode.ts`): a port of `feature_transformations.py`
   (`extract_state` and helpers) from a **seat view** — own hand, public tricks and current trick,
   the declarer, the declaration, the bid, the skat only if the seat is the declarer who picked it up,
   an Ouvert declarer's hand — never the `Game`. Both suit-normalisation layers, relative seats,
   `process_action_seq`, missing cards, points, the role-specific `obs` layouts.
3. **Policy** (`multiplayer/src/skatzero/policy.ts`): nine resident sessions (one per
   `{D,G,N}_{0,1,2}`), created once at startup, verified against the manifest, warmed, single-threaded;
   candidate rows = the engine's legal cards; argmax with stable first-on-tie; the one-step lookahead of
   the measured driver (third card of a non-Null trick, own winning candidates re-valued from the next
   lead). Shape, finiteness and legal mapping asserted; any failure throws — no fallback.
4. **Tournament** (`multiplayer/src/daily.ts`):
   - `daily_deals.computer` names the computer the day is dealt with:
     `heuristic` (all existing days) or `skatzero-play@1fe5cab+heuristic-bid` (new days).
   - New days store each deal as the full ordered move list `{seat, move}[]` — the human's moves,
     the computers' bids, pickup/hand, discard, declaration and cards. Replay applies the recorded
     moves through the engine (`applySeatMove`), collecting tricks by rule; it never asks a computer.
   - When it is a computer's turn on a new day, card play comes from the policy (bidding/skat/declare
     from the heuristics, split into their real moves), the move is validated, appended, and the next
     step follows — inside the act request, after the human's move, as now.
   - Old days keep their stored shape and replay exactly as before.
5. **Docker**: `node:24-slim` base; the committed models copied into the runtime image.
6. **Readiness** (grill Q6): `/readyz` stays false until the nine sessions are loaded, hash-verified
   and warmed; the service refuses to start on a missing or altered model.
7. **Charter**: `engineering.md` (Stack: onnxruntime-node and the model assets in multiplayer; Key
   decision: tournament computers are recorded, not recomputed; Tools: the model-hash test);
   `operations.md` (the image base, the models in the image, readiness waits for the models). Within the human's tournament
   authorization; grill Q8 confirms.

## Redline lookup

| Action | Entry | Result |
|---|---|---|
| `onnxruntime-node` in `multiplayer/package.json` | engineering.md R3 | approved by the human on the ticket (2026-10-02) |
| `multiplayer/Dockerfile` base `node:24-alpine` → `node:24-slim` | operations.md R5 "the Dockerfile's base image" | **approval required** → grill Q1 |
| `daily_deals.computer` column in production | operations.md R5 "production schema" | **approval required** → grill Q1 |
| Plan starter → standard | operations.md R5 | not now: measured locally, asked at deploy (ticket constraint) |
| 52 MB of MIT-licensed models committed | — (grill Q2: committed, licence kept) | decided |
| `onnxruntime-node` in the browser / `app/` | ticket constraint, engineering.md R6 | never: multiplayer only |

## Grill outcome

Settled 2026-10-02 (`grill.md`): Q1 approved by the human (slim base, `daily_deals.computer`, at
deploy); Q2 commit the models (no build-time fetch); Q6 readiness waits for the sessions; Q8 Tools
names the hash test; Q9 API run < 1 min, RSS headroom against 512 MB in the handoff; Q3–Q5, Q7 as
recommended.
