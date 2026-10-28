# SKATGO-147 plan

## What the code says that the ticket does not

- The felt is one stage measured in a unit `u` (`app/src/theme/table.stylex.ts`): landscape 1000u × 576u under a
  140px band, portrait 400u × 464u under a 212px band. The stage is sized so nothing on it can overlap; it has
  **no room reserved above Lina's and Noah's stacks**. What room there is depends on the screen's height:
  1280×820 about 85px, 375×812 about 84px, but a 375×667 phone 11px and a 1280×700 screen about 30px.
- The top band (info board, the table's line, on a phone Lina's/Noah's talk row at the speaker's side) is kept
  clear by the stage; an avatar put in it on a phone would sit where the talk card appears.
- A stack shows only its edge on the felt: 82u in landscape (~76px at 1280), 46u in portrait (~43px at 375).
- Every table but a private one seats Lina and Noah (`Names` is null). An exercise's endgame board shows
  every hand open and big beside the frame (SKATGO-110/111) — a different stage.
- Who took a trick (`trickWinner` at `trickEnd`) and who declares (`game.declarer` from `skat` on) are in the
  game state at every kind of table, local or server-owned, so the face can be derived from `game` alone.
- New size/position values are token-registry changes: `ui.md` Redline 1 needs the human's approval.

## Route

1. Six faces from the approved sample (`tmp/styles/style1d.png`), Azure `gpt-image-2`, transparent, then
   shrunk to small WebP files in `app/public/avatars/` (`lina-neutral.webp` …); each image looked at.
2. Stage room for the avatars (per the grill's answer): new stage tokens in `table.stylex.ts` for the
   avatar's size and place, and the stage's design height grown by the avatar's room so that on a screen short
   of height the table scales down a little instead of overlapping.
3. `Avatar` in `game-table.tsx`: a round picture above each opponent's stack at the felt's edge, face picked by
   a pure function of `game`: bidding won → laugh until the first card is played; a finished trick → the side
   that took it laughs, the other side sulks, until the trick is collected; otherwise neutral. Not on a private
   table. `alt` is the name.
4. Charter `ui.md`: the avatars' paragraph and the new tokens' rows.

Checks: build, typecheck, tokens; the table at 1280×820 and 375×812 (and a 375×667 look) without overlap;
the face function's cases with a unit check.
