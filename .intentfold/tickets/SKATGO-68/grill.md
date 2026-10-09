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
