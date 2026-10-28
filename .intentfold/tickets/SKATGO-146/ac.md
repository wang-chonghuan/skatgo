# SKATGO-146 acceptance checks

Local web 55146, multiplayer 56146, database 57146. Playwright, phone 375×812 and PC 1280×820. Acceptance plays
no game; the dialog is opened in the browser pane once for the screenshot shown to the human.

1. **Sizes** — in the after-deal dialog every text node outside the You/AI tags computes `font-size` ≥ 16px, the
   title 22px (script over `getComputedStyle`); grep: `ResultCard`, `GameTag`, `SeatScores`, `BidCompare`,
   `WorstTrick` use no `small`, `smallBold`, `micro`, `note`.
2. **Three scores** — `SeatScores` under `GameTag` shows You, Lina, Noah with `seegerFabian(game)`; the own cell
   is marked (`data-own`); values equal the table board's deal scores.
3. **Rows** — the same components render in `VsAiTable` rows (shared code, read).
4. **Languages, private table** — de keys for any new text; the private-table branch unchanged in the diff.

Mechanical defence once before the handoff.
