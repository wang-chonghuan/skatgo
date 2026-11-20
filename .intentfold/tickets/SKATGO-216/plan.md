# SKATGO-216 plan

## What the code says that the ticket does not
- Every finished deal already has each seat's Seeger-Fabian score (`seegerFabian` in `app/src/lib/skat/tournament.ts`,
  `summarize(...).scores`), room-seat order on the server; a League review's `mine.scores` has the player at 0.
- A deal's points were a lookup table (`DEAL_POINTS[outcome]`); the outcome also names the result line ("You beat the
  declarer"…), so the outcome stays and only the points change. `saved` and its line go with the 40 line.
- Leaving (SKATGO-206) was a fixed −3 / −2. With points that depend on the game, a fixed number would make leaving a big
  game cheap; the loss is scored at the game played out instead.
- Standings are on the +30/−20 scale (`league_players.scale` 2); SKATGO-205 reset points once when the scale changed.
- SF of an odd game value won gives defenders a half point: rounded.
- Forum post 7 explains the League's +3/−3/−2/40 scoring with numbers and says "+30 points to move up".

## Route
1. `league.ts`: `dealPoints(scores, seat)` = round(own − average of the other two); `forfeitPoints(declarer, value, seat)`
   = their side's loss at the game played; `dealOutcome` without card points; `PROMOTE_AT` 1000, `RELEGATE_AT` −1000;
   `DEAL_POINTS` / `SAVE_AT` removed.
2. Multiplayer `league.ts`: score each seat with them (seen to the end, left, away); `store.ts`: scale 3, points to 0 once.
3. Web: `saved` line removed; rules lines EN/DE (formula with an example; ±1000).
4. Tests: unit (formula, rounding, zero sum, forfeit, thresholds); service League test against the reviews' scores and the
   forfeit rule; the scale reset to 3.
5. Charter `product.md` / `ui.md`.
6. Forum post 7: the League part rewritten for SF against the table, numbers recomputed on the same deals; title unchanged.
