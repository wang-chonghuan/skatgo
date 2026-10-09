# SKATGO-68 plan

## What the code already does that the ticket does not say

- The trick lives in the table's gold frame (`game-table.tsx`, `skat-frame`). The frame is a square of `stage.frame`: 300u on a landscape stage, 250u in portrait.
- Each played card is `dims.trickCard`, 26% of the frame (78u / 65u). A hand card is `stage.handCard`: 130u / 96u wide, 182u / 134u tall.
- The cards sit at fixed places:
  - Lina's at `trickSideInset` from the left and `trickSideTop` (27%) from the top;
  - Max's mirrored on the right;
  - yours at `trickMineLeft` / `trickMineTop` (37% / 52%).
  The places say who played which card.
- The seat plates lie on the frame's left and right edges at mid-height, and yours under the bottom edge. `trickSideInset` (`max(9%, 18px)`) is what keeps a side card clear of its plate.
- Cards enter in play order (`game.trick`), so a later card already lies above an earlier one in the DOM.
  - Your card flies in from the hand (`layoutId`), the computers' from their sides (`trick.from`).
  - A landed card gets its own layer.
- The skat, during bidding, lies in the same frame at the same 26% (`frameCard`, "the same size as the trick's cards").
- Every card has its index in two corners (SKATGO-66): top left, and turned at the bottom right.

## Route

1. Played cards are `stage.handCard` wide: the same size as the hand, on every stage.
2. Each card's place points to who played it, and the cards overlap. On a landscape stage (portrait in brackets):
   - **Lina's:** `trickSideInset` from the left edge, 2% from the top. It spans 27–157u (22–118u).
   - **Max's:** the mirror image on the right.
   - **Yours:** centred, `trickSideInset` from the bottom. On a small stage (phone landscape), 2% let the fixed-height plate under the frame cover your card's bottom index; `trickSideInset` is the charter's existing "clears the plate on that edge" value.
   - **Overlap:** yours overlaps both side cards' lower inner corners. The side cards overlap each other a little on a landscape stage, not at all in portrait.
   - **Index:** whatever was played later, one full index of every card stays uncovered: Lina's top left, and the bottom right of Max's and yours. The plates stay clear: the side cards keep `trickSideInset` from their edge, yours keeps 2% above the bottom edge.
3. The order shows by stacking: DOM order is play order, so the later card lies on top. No other change is needed.
4. The skat during bidding goes to hand size as well (grill Q2), two cards side by side: 266u of 300 (198u of 250).
5. Tokens (grill Q3):
   - `dims.trickSideTop` → `dims.trickEdge` '2%', used for the side cards' top;
   - `dims.trickMineTop`, `dims.trickMineLeft` and `dims.trickCard` removed. Yours is centred with `left: 0; right: 0; margin-inline: auto`, so it needs no value of its own;
   - `trickSideInset` unchanged.
   No other new value.
6. Charter: `ui.md` gets one line on the trick under the table, and the `shape.stylex.ts` registry comment changes.

## Files

- `app/src/components/skat/game-table.tsx` (trick and skat styles, positions)
- `app/src/theme/shape.stylex.ts` (the trick tokens)
- `.intentfold/charter/ui.md`
