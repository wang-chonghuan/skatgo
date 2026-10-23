# SKATGO-127 handoff

A player's two suggestions: the "Augen" cell switches to the tricks with a tap and remembers it; every deal's result
shows its whole calculation.

## What changed

- **Setting** — `lib/skat/settings.ts`: `boardTricks` (off by default) in `skatgo.settings.v2`, `useBoardTricks`.
- **Engine** — `lib/skat/game.ts`: `runningTricks`, the tricks each side has taken.
- **Table** — `game-table.tsx`: the info board's "Augen" cell is a button (the cell's look, a focus ring): a tap
  switches it between card points and "Stiche" and stores the choice; the strip's pill follows.
- **The calculation** — `lib/skat/i18n.ts` `settlementFormula` (tested by `formula.test.ts` on engine settlements):
  parts → multiplier; contract base × multiplier = value · won +score / lost −2 × value = −score / overbid: the bid
  above the value, scored at …, lost −2 × …. Shown in the tournament's result under the comparison with the AI, in
  free play right after the score sheet (it stood at the foot of the play record, which no longer has that slot),
  and on a private table in the settlement.
- **Messages** — `info_tricks`, `info_show_tricks`, `info_show_points`, `table_tricks`, `result_formula_won`,
  `result_formula_lost`, `result_formula_overbid`.
- **Charter** — product, ui.

## AC results

1. **Tap switches the cell.** PASS — free play at 1280×820 and 375×812: "AUGEN" → tap → "STICHE" → tap → "AUGEN"
   (`tmp/ac.mjs`, headed Chromium).
2. **Remembered.** PASS — after a reload the cell still shows "STICHE".
3. **The breakdown.** PASS — on engine settlements: won "with 3 + game 1 → multiplier 4; Hearts ♥ base value 10 × 4
   = 40 · won: +40"; Schneider adds 1; lost "· lost: −2 × 40 = −80"; overbid "overbid: the bid 46 is above 40, so it
   is scored at 50, lost: −2 × 50 = −100" (`formula.test.ts`).
4. **Everywhere.** PASS by construction — the one line is placed in the three results (tournament, free play,
   private table); no deal was played through for it (acceptance plays no games).

Mechanical defence — pass (286 unit tests).

## Deviations

None from `plan.md`.

## Environment

Ports: web 55127, multiplayer 56127, database 57127 (empty). No env change.

## Residual

None.

## Check

1. http://localhost:55127/de/spielen — tap "Augen" on the board: it reads "Stiche"; play a trick or two and see the
   counts; reload, it stays.
2. http://localhost:55127/de/spielen — finish a deal: the calculation line right under the score sheet.

## Decided for you

- Card points by default; the choice kept in this browser for every table with the board.
- The cell itself is the switch, nothing added to it; its label says what it shows.
- In free play the calculation moved from the foot of the play record to right after the score sheet.
