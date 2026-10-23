# SKATGO-127 plan

## What the code already says

- The table's info board (`game-table.tsx` `InfoBoard`) has a cell "Augen": during play the declarer's and the
  defenders' card points (`runningPoints`), the player's side in amber; the narrow strip repeats them as a pill.
- The table's display choices are kept in this browser (`lib/skat/settings.ts`, `skatgo.settings.v2`).
- A settlement already carries the breakdown (`Settlement`: base, parts, multiplier, value, score, overbid), and the
  table already writes it as one line ("mit 3 + Spiel 1 + Schneider 1 → Multiplikator 5; Herz Grundwert 10 × 5 = 50"):
  in full on a private table's result, at the foot of the play record in free play, not at all in the tournament.
  It does not say what a loss or an overbid does to the score.

## Route

1. **The cell** — the "Augen" cell is a button: a tap switches it between the card points and the tricks each side
   has taken ("Stiche 3 : 2", the player's side in amber); the choice is a setting (`boardTricks`), remembered, the
   card points by default. The strip's pill follows it.
2. **The breakdown** — one line, the same everywhere: the parts, the multiplier, base × multiplier = value, and then
   the score: "+50", or "verloren: −2 × 50 = −100"; an overbid says the bid and the value it is scored at. Shown in
   the tournament's result (under the comparison with the AI), in free play right after the score sheet (no longer at
   the foot of the play record), and on a private table where it is now.
3. **Charter** — ui (the cell, the line), engineering if the settings key changes (it does not: a new field).
