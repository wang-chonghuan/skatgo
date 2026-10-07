# SKATGO-57 rework

Relative to the frozen `handoff.md` (`4d35dd3`).

## Round 1 — 「我还是认为，你光显示一个我得几分没用，这是个三人游戏，我要知道其他两个人得几分，懂吗」(2026-10-07)

- The three tiles (you / AI / difference) became a score table that leads the settlement. Its columns are your seat, Lina and Max, with your seat shaded. Its rows are your deal, the AI's deal, and the difference on every seat.
- The two side cards dropped their scores line, since the scores now live in the table.
- Messages: `daily_row_you`, `daily_row_ai`, `daily_col_seat` added; `daily_line_scores` removed.
- Rechecked: AC2 and AC3 (17/17), tests 83.

## Round 2 — 「我都不用管差几分，我一眼看出来。然后这个结果弹窗里，不要再搞个卡片，另外折叠的部分禁止嵌套」(2026-10-07)

- The difference row is gone; the table is your deal over the AI's for all three seats.
- No card inside the dialog: the daily settlement no longer wraps its body in a `Panel`, and the two sides lost their borders. They are two plain columns, stacked on a phone.
- Folds never nest: inside "Tagesverlauf" the day's table renders with `VsAiTable flat`, plain rows with no toggles and no details. `/daily` keeps its foldable rows, since nothing folds around them there.
- Rechecked: the full AC (19/19), with two new checks, no fold inside a fold and no card inside the settlement. Tests 83.

## Net effect

- The settlement leads with every seat's score in your deal over the AI's, then each side's auction and game.
- The details and the day are two folds that do not nest, with no boxes inside the dialog.
- The day table's "Diff." column (SKATGO-48) stays.
