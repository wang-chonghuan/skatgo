# SKATGO-154 acceptance checks

1. The 「第五题」 hand and every question whose named suit has fewer trumps than another suit are gone: multiplayer test, and
   a count over the new data (0 such questions).
2. Every bid question's contract is SkatZero's own: multiplayer test (`sure ≥ 0.6` for all; four recomputed by SkatZero
   equal their recorded share).
3. The practice still works: unit tests (logic), the SKATGO-151 acceptance script against the ticket's preview (two steps,
   explanation, cheat sheet, stats, layout).
