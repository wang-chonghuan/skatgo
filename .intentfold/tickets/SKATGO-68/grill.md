# SKATGO-68 grill

Batch 1, written before asking. Decision-maker: the human.

## Q1. How the three cards lie

**Recommendation:** each card toward the player who played it: Lina's at the top left, Max's at the top right, yours at the bottom centre. They overlap; a later card lies on top. One whole index of every card always stays uncovered: Lina's top left, and the bottom right of Max's and yours.

**Alternative:** one row, left to right in play order, each card covering the next one's right part. It shows the order more plainly but no longer who played which.

**Reason:** at a Skat table you see who played what by where the card lies; the order shows by stacking.

**Answer:** the recommendation: toward the player who played it, overlapping, later on top (the human, 2026-10-09).

## Q2. The skat during bidding

**Recommendation:** hand size too, the two cards side by side in the frame. Today it is the same size as the trick's cards, and they fit.

**Answer:** the recommendation: the skat at hand size too (the human, 2026-10-09).

## Q3. Tokens (ui.md Redline 1)

**Recommendation:** approve the trick tokens in `shape.stylex.ts`:
- `trickSideTop` (27%) becomes `trickEdge` (2%), the distance from the frame's top for the side cards and from its bottom for yours;
- `trickMineTop`, `trickMineLeft` and `trickCard` are removed: the cards take `stage.handCard`, and yours is centred without a value.

There is no other new value.

**Answer:** approved (the human, 2026-10-09; ui.md Redline 1, recorded on the ticket).

## Changed after the first delivery

- **Every card's top-left number in the open, whatever the order** (the human, 2026-10-09): 「这个设计基本上完美。但是最好在任何情况，都能让左上角的数字漏出来，否则我要从右下角倒着看才行。可能你没必要让两张牌的顶部在一条线上？思考一下」.
  - Where two cards overlap side by side, the right one's top-left corner lies inside the left one, so the right one must lie higher by at least the number's height.
  - The three cards therefore step up from left to right: Lina's lowest, yours one step up, Max's highest.
  - **Approved by the human** (ui.md Redline 1): two new values in `table.stylex.ts`, `stage.trickSecond` and `stage.trickThird`, the second and third steps' tops.
