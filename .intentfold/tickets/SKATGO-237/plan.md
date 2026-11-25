# SKATGO-237 plan

What the code already says that the ticket does not:
- The page reads the lines from `START_AT` / `PROMOTE_AT` / `RELEGATE_AT` (`league_up_at`, `league_about_move`, the bar
  `(points - RELEGATE_AT) / (PROMOTE_AT - RELEGATE_AT)`), so no copy holds the number; changing the constant moves the
  page, the bar and both services (the multiplayer imports the same `league.ts`).
- `standingAfter` promotes when a deal's result is ≥ `PROMOTE_AT`, so a player already above the new line moves up on
  their next counted deal — no migration needed and none wanted (start and relegation lines unchanged, points kept).
- The `scale` column marks one-off point migrations; this ticket adds none, so it stays 5.

Route (one slice):
1. `app/src/lib/skat/league.ts`: `PROMOTE_AT = 2000`; rewrite the doc comment's numbers (SKATGO-237 reason, retention
   simulation, history line).
2. `app/src/lib/skat/league.test.ts`: the lines' expectations to 1500 / 2000 / 0.
3. Charter: product.md League section, engineering.md league constants line, ui.md League page lines and bar.
