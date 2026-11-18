# SKATGO-208 rework

Relative to the frozen handoff (98645d6). Two rounds, each its own commit.

## Round 1 — 16cae39
Ask: 「联盟打牌结算界面，下一局下面要有个退出按钮。然后右上角的圆形，在结算时就不要显示了」
- A League deal's result: under the next deal, "Leave the table" (`quiet`, as free play's "Play again"), which leaves the
  table for the League page (`room.leave`). A result that shows only "Zur Liga" is unchanged.
- While a League deal's result shows, the top right round button is not there; it is back with the next deal. Other
  tables keep it over their results.
- Charter ui.md: the League result's foot and the way-out bullet.
- Rechecked: typecheck, build, design tokens; the League table opens and deals with the corner button there while the
  deal is played. The result itself is reached only by playing a deal, so it was left to the human's own deal.

## Round 2 — 1ba0ad0
Ask: 「XP & win rate 榜单上，那个You这个标签不要显示了，本工单改」
- The XP & win rate board: the own row keeps its `goodSoft` background, without the "You" tag.
- Charter ui.md to match.
- Rechecked: typecheck, build; at 1280 and 375 a test account's own row is marked and carries no tag.

## Net effect
The handoff's Bidding names fix, plus the League result's way out under the next deal (no corner button over it), and
the XP board without the "You" tag. No env key changed.
