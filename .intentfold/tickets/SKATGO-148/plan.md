# SKATGO-148 plan

## What the code says that the ticket does not

- The bidding rows share a three-column grid aligned to the centre; both tags of an "alike" row are stacked in one
  cell, so with a wrapping outcome the tags sit between the lines.
- "On the table" carries a 4px top padding meant to line it up with a row of cards; beside "You led" it drops below.
- A face holds until the trick is collected (1.2s by default, until the tap with "tap to collect"), and the bidding
  laugh until the first card.
- The talk card has no tail; beside the frame (wide) the speaker's face is above it, in the band (phone) beside and
  below it.

## Route

1. `daily-comparison.tsx`: the grid on the first baseline; an alike row's two tags side by side.
2. The label's padding only beside cards.
3. `SeatFace`: a laugh or a sulk for at most 1.5s (`FACE_HOLD`), started once per moment (the won bid, each trick).
4. The talk card's tail: a border triangle in the existing tokens (`space.x14`, `x16`, `x20`, `color.surface`), up and
   out beside the frame, sideways out of its edge in the band, on the speaker's side.
5. Charter ui.md lines for each.
