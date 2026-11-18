# SKATGO-207 plan

Found in the code: Bronze's floor is `RELEGATE_AT` in `standingAfter` (app/src/lib/skat/league.ts), the League card's bar
runs from `RELEGATE_AT` to `PROMOTE_AT` for every tier below Legend (league.tsx `MeCard`), Bronze already shows no
"to relegation", and the About bullet says "−20: down one, never below Bronze". Production: one Bronze account at −6.

Route:
1. `league.ts`: `BRONZE_FLOOR = 0`; in Bronze points stop at it. Unit tests to the new floor.
2. `league.tsx`: the bar's low end is the floor of the player's tier — `BRONZE_FLOOR` in Bronze, `RELEGATE_AT` above.
3. `league_about_move` EN/DE: Bronze never below 0.
4. `multiplayer/src/store.ts` migration: `UPDATE league_players SET points = 0 WHERE tier = 0 AND points < 0` (idempotent,
   every start; lifts the existing negatives once and finds none after).
5. charter product.md (Bronze stops at 0) and ui.md (the bar from 0 in Bronze).
