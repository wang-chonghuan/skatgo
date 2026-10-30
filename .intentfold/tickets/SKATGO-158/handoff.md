# SKATGO-158 handoff

## What changed

- **Table geometry** (`app/src/theme/table.stylex.ts`):
  - The unit `u` and the stage's top are SKATGO-34's again: `u` over 576 / 464, and the stage at half the free height.
  - The faces add a condition that moves the stage only by what a face lacks:
    - In landscape, a ten-card stack's top stays 4u under the face's foot.
    - In portrait, the face's top is not above the board's foot.
    - Where the condition binds, a third term keeps the hand on the felt.
  - New token `tableBand.boardFoot`: 153px on a phone, 169px otherwise.
  - Portrait `faceTop` is now 74.5u above the stage, 4u above a ten-card stack.
  - Nothing depends on the faces switch.
- **Frame** (`app/src/components/skat/game-table.tsx`): the seat plates and the opponents' bid chips come first in
  the frame, and the skat pile is positioned. The skat and the trick's cards lie over them. The chips were added after
  the fresh-eyes look saw a "PASS" chip lying on a skat card.
- **Charter** (`ui.md`): the faces' rule, the faces-off sentence, the frame-as-backdrop sentence, and the
  `table.stylex.ts` registry row.

## AC results

Measured with the running ticket build at `/en/play`, against the SKATGO-34 formulas computed in the same felt.

1. **Frame and stacks as before SKATGO-147: pass.** Measured frame left, top, width (want):

   | Viewport | Frame left, top, width | Stack centres (want) | Before this ticket |
   |---|---|---|---|
   | 369×664 | 69.2, 233.2, 230.6 (69.2, 233.2, 230.6) | 320.8 (320.8) | frame top 308.4, width 195.8 |
   | 390×844 | 73.1, 311.5, 243.8 (73.1, 311.6, 243.8) | 404.2 (404.2) | |
   | 1280×800 | 322.6, 213.8, 276.5 (322.6, 213.8, 276.5) | 310.6 (310.6) | frame top 270 |

   The 1280×800 felt is 921.6 wide, beside the pinned panel.
2. **Faces on or off: pass.** With the faces switched off and the page reloaded, the frame's rect was identical at all
   three viewports, and no face was drawn.
3. **Faces clear: pass.** At all three viewports neither face intersects the board, the frame, or either ten-card
   stack.
   - 369×664: face 155.3–218.9; board foot 153; stack top 222.6.
   - 390×844: face 229.2–296.4; stack top 300.4.
   - 1280×800: face 72–156.8; stack top 200.9.
4. **Frame centred: pass.** The frame's horizontal centre is 0.0px from the felt's at all three viewports. The
   vertical position is check 1's.
5. **Cards over plates: pass.**
   - Paint order: the frame's children are, in order, `skat-seat-1`, `skat-seat-2`, `skat-seat-0`, the bid chips,
     then the skat pile (`position: relative`) and the trick's cards (`position: absolute`). The cards are positioned
     and come later, so they paint over the plates.
   - Measured: at 369×664, where Lina's "18?" chip and a skat card overlap, `elementFromPoint` returns the skat card.
     Screenshot: `tmp/chips-369x664.png`.
   - No trick was played for this check, since acceptance plays no game.

Mechanical defence: passed. Typecheck, build, 306 tests, client bundle, design tokens, literal grep, SSR link,
`check:seo --built`, and `test:seo` 28/28.

## Deviations

- The faces' clearance is measured from a ten-card stack, not SKATGO-147's twelve, so the 369×664 phone does not move
  at all. The reason is in `plan.md`.

## Environment

- Ports: web 55158, multiplayer 56158, database 57158.
- No env keys added, changed or removed.
- Local runtime: Docker container `skatgo-multiplayer-db-57158` on context `colima-skatgo`. Its credentials are in
  `tmp/db.env`, which is ignored.

## Residual

None.

## Check

1. http://localhost:55158/en/play on a tall phone (390×844): each face sits just above its stack, so between the
   score board and the faces there is felt (about 76px). The fresh-eyes look expected you to want the faces right under
   the board on every phone. I kept them over their stacks, so each face reads as its stack's. On your 369×664 phone
   both readings give the same place.
2. The same page at your phone's size: the frame and both stacks where they were before the faces, and the bid chips
   ("18?", "PASS") under the skat cards.

## Decided for you

- "Back to before the faces" covers the frame's and stacks' place and the table's scale. The opponents' cards keep
  SKATGO-148's size, which you chose.
- The faces keep 4u clear of a ten-card stack. While an opponent picks up the skat (twelve cards for a moment), their
  stack lies over the foot of the face.
- In portrait the faces sit under the score board, not beside it. The board leaves 60px a side, less than a face
  needs on any common phone.
- The table's layout is the same with faces on or off.
- The frame stays drawn after the stacks. The skat and played cards go over the plates and the bid chips. Stacks and faces never reach
  the frame in this layout.
- Error messages, the line under the board, or a talk bubble may briefly lie over a face's edge, as agreed.
