# SKATGO-156 plan

1. Hand-over (multiplayer): `/healthz` is 200 as soon as the process listens, so Render switches traffic to a new instance
   that is not the leader yet; the old leader keeps the advisory lock until Render stops it (Render: SIGTERM 60 s after
   the new is live), which took about three minutes each deploy. A new instance, once SkatZero is loaded, NOTIFYs the
   leader (`skatgo_leader_handoff`); the leader closes its tables (`matchMaker.gracefullyShutdown`), releases the lock
   (`Store.stepDown`) and stays up, healthy, until stopped; the newcomer acquires within a second. `render.mjs` waits up to
   10 minutes for readiness (the first deploy's old instance has no hand-over yet).
2. Bidding practice: round white button (the header gear's look, lucide `LayoutGrid`) beside "x/600" opens "All questions"
   in the cheat sheet's `Modal`: the Skat-Tricks levels' tiles, mistakes `badSoft`/`bad`, current ringed `go`, not reached
   shut; questions only up to the run's; the folded "Mistakes" removed.
3. Cheat sheet link without icon, on the seat's line (`nowrap`; "Cheat sheet" on a phone).
4. Daily page: the two toggles as `linkLook` md buttons (chosen `go`, other `quiet`).
5. Charter: ui.md, product.md, operations.md.
