# SKATGO-146 plan

## What the code says that the ticket does not

- The table's dialogs speak in the app roles: `Say` is `appText` (16), buttons `appBtn` (16), titles
  `dialogTitle` (22). SKATGO-145 put course roles (`note` 14, `small` / `smallBold` 13, `micro` 12) into
  `ResultCard` (`game-table.tsx`), `GameTag`, `BidCompare` and `WorstTrick` (`daily-comparison.tsx`).
- The three seats' scores of the deal are `seegerFabian(game)` (and `DealSummary.scores` on rows); the old
  `ScoreSheet` marked the own seat with `color.page`.
- At 16px plus a row of three scores the dialog no longer fits 375×812 with a ten-card hand (it fitted at
  719 / 736 px before). SKATGO-145's one-screen criterion is replaced by this ticket's.

## Route

1. `daily-comparison.tsx`: `GameTag`, `BidCompare`, `WorstTrick`, the review's loading/failure lines → `appText`
   for words, `appBtnStrong` for numbers and block headings; `SeatScores` (new): three cells, name over score,
   the player's cell on `color.surface` with `radii.column`.
2. `game-table.tsx` `ResultCard`: rows `appText` / `appBtnStrong`; `SeatScores` under `GameTag`.
3. Fit: the dialog's content scrolls when it is taller than the phone; the "Next deal" button stays pinned at
   the dialog's foot, so the one action is always on screen. Measured at 375×812.
4. `ui.md`: the four-sizes paragraph and the `VsAiReview` row to the new roles.
