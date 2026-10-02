# SKATGO-38 acceptance checks

Local only: multiplayer on 56038, PostgreSQL on 57038, web on 55038; the Python reference from
`.intentfold/tmp/SKATGO-22/benchmark/` as the oracle. Scripts in `tmp/`. No gameplay in the browser.

## AC1 — from the switch day every computer card is SkatZero's, legal, and the same for everyone

- With the local clock on a day dealt after the switch, players A and B each play the whole day
  through `/api/daily/*` (headless, rule-engine moves, the same moves for both).
- **Pass**: `daily_deals.computer` for that day names the SkatZero version; every computer `play` in
  both entries' stored move lists equals the card the Python reference chooses for that seat's visible
  state (recomputed offline from the stored list), is legal by the engine, and A's and B's computer
  moves are identical deal by deal.
- The whole API run for A and B finishes in under a minute.
- Fault path: with one model file corrupted (hash mismatch) the service refuses to start and
  `/readyz` never turns true; with the
  policy forced to throw (acceptance-only env), an act answers an error and the entry is unchanged —
  no heuristic card is stored.

## AC2 — encoding and model output equal the Python reference

- **Runtime parity**: the nine saved feeds from SKATGO-22 run through the service's sessions; every
  output element within `1e-5 + 1e-4·|ref|`, argmax identical.
- **Encoder + policy parity**: ≥ 300 visible states sampled from engine games (all of D/G/N ×
  roles 0/1/2; opening, mid and last tricks; first/second/third card of a trick; lead changes; void
  suits; Null; Ouvert where the heuristics declare it) are fed to the TS encoder and to SkatZero's
  Python `extract_state` (+ the driver's lookahead): `obs`, `history`, `actions` equal element for
  element, values within tolerance, the chosen card identical.
- A compact subset of these fixtures is committed as a multiplayer test.

## AC3 — reload/continue never changes a computer card; old days unchanged

- Mid-deal, reload state twice and continue: the computer cards already on the table and in the
  stored list are unchanged, and the policy is not called for them (call counter in the check run).
- An entry and its scores from a pre-switch day (heuristic) read back byte-identical before/after
  deploying this code; state for it replays to the same view.

## AC4 — latency and memory

- Local Linux container (`node:24-slim`, the built image): p50/p95/max of one computer card decision
  (encode + inference + lookahead) over ≥ 1,000 decisions; **p95 ≤ 50 ms**. Process RSS after loading
  the nine models and at peak, recorded in the handoff with the headroom against Render starter's
  512 MB; flagged if under ~100 MB.
- `/readyz` is false until the nine sessions are loaded, verified and warmed.
