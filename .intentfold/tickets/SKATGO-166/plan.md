# SKATGO-166 plan

## Found in the code, not on the ticket

- The after-deal dialog has three shapes: the course's teaching one (hints tables), the result card + AI review
  (daily, free play, lesson 11: `vsAi`), and the private room's tinted panel with a facts line, a long formula line,
  the skat and the room's "This game:/Total:" lines (`room.standings`). The passed-in deal has its own dialog.
- The same score is shown up to three times (title, seat scores, last calculation row; in a room the formula's end
  and "This game:"). The card points of a declared game are not in the result card at all, only in the bidding
  rows' second line.
- The review below it (`VsAiReview`) repeats the deal: the player's bidding row carries the deal's outcome and the
  player's score, and the folded play record ends with the skat.
- Free play's board totals are the local game-value sum since the page opened (`scores` in `Table`), not the round's
  Seeger-Fabian totals every other table shows; lesson 11 likewise. A "Total" row in the dialog has to equal the board.
- The dialog uses seven type roles today (dialogTitle, appBtnStrong, appText, badge, note, small/smallBold, micro).

## Route

1. `game-table.tsx`: one `DealResult` for every non-course table and the passed-in deal — the tinted box with the
   headline and one reason line; under it the score table (left, you, right; "This deal", "Total"); the skat; one
   calculation line that does not restate the result; then, at a table against the AI, the review in its
   after-deal form. Course tables keep their teaching settlement. Remove `ResultCard`, `GameTag`/`SeatScores` use,
   `room.standings`.
2. Totals: tournament and room as now; free play and lesson 11 from the round's deals plus the finished deal's
   Seeger-Fabian scores — the board shows the same numbers.
3. `daily-comparison.tsx`: `VsAiReview` gets an after-deal form: "The AI in your seat" with its score; bidding rows
   only where the AI said something else (yours without the game, already in the headline), or one AI row where the
   same bidding ended otherwise; the trick without its second heading; the record without the skat. The record's
   table is set in the dialog's four levels everywhere (16 bold, 16, 13 bold tags/labels).
4. `i18n.ts`: headline, reason and calculation-line helpers; en/de messages. Unit tests for them.
5. Charter `product.md` / `ui.md`: the settlement passages rewritten to the new structure.

Redlines: nothing in the route touches production data, deploys, secrets or button styles.
