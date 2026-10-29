# SKATGO-156 acceptance checks

1. Hand-over: two local instances on one database — the second ready within seconds of starting, the first logs
   `handover`/`stepped_down`, `/readyz` 503 / `/healthz` 200 on the old, 200/200 on the new; the old exits cleanly on SIGTERM;
   multiplayer test `handoff.test.ts`. Production: the deploy's readiness after the merge (first deploy still waits for the old).
2–6. `tmp/ac.mjs` (PC 1280×820, phone 375×812): dialog with 600 numbers, the mistake red, the current ringed, only reached ones
   enabled, opening and closing, scroll inside; cheat sheet link without icon on the seat's line (en, de); daily toggles 16px,
   40 tall; no sideways scroll. Plus the bidding practice regression (`tmp/regression.mjs`).
