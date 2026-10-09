# SKATGO-68 handoff

## What changed

**The trick and the skat in the table's frame** (`game-table.tsx`; used by free play, lesson 11, the daily tournament and private tables)

- A played card is as big as a card in the hand (`stage.handCard`) on every stage, no longer 26% of the frame.
- The cards overlap, each lying toward who played it:
  - Lina's at the top left and Max's at the top right, `trickEdge` (2%) from the frame's top and `trickSideInset` from their side;
  - yours centred, `trickSideInset` above the bottom edge.
- Cards enter in play order, so the later one lies on top.
- Whatever lies over it, every card keeps one whole corner index in the open: Lina's top left, and the bottom right of Max's and yours.
- The skat during bidding is hand-sized too, the two cards side by side in the frame (grill Q2).
- **Tokens** (`shape.stylex.ts`, approved, grill Q3):
  - `trickSideTop` (27%) became `trickEdge` (2%);
  - `trickMineTop`, `trickMineLeft` and `trickCard` were removed. Your card is centred with `left: 0; right: 0; margin-inline: auto`.
- Your seat's plate slot gets `data-testid="skat-seat-0"`, like the other two, so a check can find it.
- **Charter:** `ui.md`'s `GameTable` row says how the trick lies.

## AC results

Local web 55068, multiplayer 56068, database 57068. Headed Playwright (`tmp/ac68.mjs`), free play driven by scripted legal moves (pass, first legal card), two full tricks per size:
- desktop 1280×820;
- phone portrait 375×812;
- phone landscape 812×375.

1. **Same size as the hand.** Met. Trick cards are 120 / 90 / 53 px wide, equal to the hand's on every size and in every trick.
2. **Every card's index can be read.** Met. For each trick card, the centre of its top-left or bottom-right index is that card's own pixel (`elementFromPoint`). All 6 tricks: true, true, true.
3. **The order shows.** Met. In every overlap the earlier card never shows above a later one: 3 overlaps per trick on desktop and landscape, 2 in portrait, where the side cards do not touch.
4. **Nothing covered, nothing overflows.** Met.
   - No trick card's box meets a hand card, any of the three seat plates or the info board, and there is no horizontal scroll.
   - The skat is hand-sized (120 / 90 / 53 px) and inside the frame.

No page errors. Screenshots: `tmp/ac-trick*-*.png`, `tmp/ac-skat-*.png`.

**Mechanical defence**: passed in full. typecheck, build, 101 tests, client bundle (21 chunks), design tokens (120 files), literal grep, SSR link, `check:seo -- --built` (44 indexable, 4 noindex), `test:seo` 25/25.

## Deviations

- **Your card's distance from the bottom** is `trickSideInset`, not the planned 2%. On a phone held sideways the stage is tiny, while the plate under the frame keeps its 28 px, so it covered your card's bottom index. `trickSideInset` is the charter's existing "clears the plate on that edge" value, so no further token was needed.
- **The check's own fixes** (not product changes): on a phone the hand is a tight fan, so the driver taps a card's corner; a tap can scroll free play down to its reading section, so the check scrolls back up before measuring.

## Environment

- Ports 55068 / 56068 / 57068. Web and multiplayer are left running for review; the local database container `skatgo-multiplayer-db-57068` is running.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` port were pointed at the ticket ports for local acceptance only.
- **No env key added, changed or removed.**

## Residual

- None from this ticket. SKATGO-64 (the opponents' names, bids and contract beside their seats) is the other half of the forum's points 2–3.
