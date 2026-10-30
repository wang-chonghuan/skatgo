# SKATGO-158 plan

## What the code says that the ticket does not

- The stage (frame, stacks, hand) is positioned by `app/src/theme/table.stylex.ts`. SKATGO-147 changed two things
  there: the unit `u` was divided by 707 / 577 instead of 576 / 464, and the stage top became
  `max(half the free height, 131u / 113u)`. That reserve applies whether or not the faces need it. Measured now:
  - 369×664: frame top 308px. The SKATGO-34 formulas put it at 233px.
  - 1280×800 (felt 922px beside the pinned panel): frame top 270px. The formulas put it at 214px.
- The band is 212px in portrait, but the info board in it is only 153px tall on a phone (169px on a wider portrait).
  The band's left and right 60px are always free (`boardWidthPhone: calc(100% - 120px)`), but a face plus its inset
  (73u) is wider than 60px on every common phone. So in portrait a face fits only under the board's foot, not beside
  it.
- In landscape the face's top is fixed at 72px, beside the board (SKATGO-148).
- Inside the frame, the seat plates come after the trick cards in the DOM, and both are positioned, so a plate paints
  over a card. The skat pile is not positioned, so it paints under the plates whatever the order.

## Route

1. `table.stylex.ts`:
   - Back to SKATGO-34's unit and stage top: `u` over 576 / 464, and the stage top at half the free height.
   - Add one condition for the faces: the stage moves down only by what the face lacks.
     - Landscape: a ten-card stack's top must stay 4u under the face's foot (72px + 92u). So the stage top is at
       least `100u - 68px`, and `u` is at most `(100cqh - 72px) / 676`, so the hand still fits.
     - Portrait: the face's top must not be above the board's foot (new token `boardFoot`, 153px on a phone,
       169px otherwise), with the face 4u above a ten-card stack. So the stage top is at least
       `boardFoot + 74.5u - 212px`, and `u` is at most `(100cqh - boardFoot) / 538.5`.
   - `faceTop` in portrait: 74.5u above the stage top, which is 4u above a ten-card stack.
   - The tokens depend only on the screen, not on the faces setting, so switching the faces off moves nothing.
2. `game-table.tsx`: the seat plates first in the frame, and the skat pile positioned. Plates then lie under the trick
   cards and the skat.
3. Charter: ui.md and the table token comment, where SKATGO-147's "the faces have their own room above the stage"
   rule is amended.

Material departure from the proposed solution: the faces' clearance is measured from a ten-card stack, not a
twelve-card one. With twelve, the 369×664 phone would still move. An opponent holds twelve only while picking up the
skat, and then the stack lies over the face's foot for that moment, as an open hand already may (SKATGO-148).
