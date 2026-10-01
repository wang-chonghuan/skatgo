# SKATGO-34 plan

- Measured on skatgo.com (phone viewport, 4× CPU slowdown):
  - Frames are smooth, the longest 33ms, so nothing is janky in the rendering.
  - The played card leaves the hand at once, and a new, transparent card fades in about 170px away near
    the trick, then springs back into place. The eye loses the card for a moment, which reads as a stall.
  - Opponents' cards appear the same way, ±120px from the trick.
- Route:
  - The table's hand (`Fan`, new `flight` prop) gives each card a shared `layoutId`, and the learner's
    trick card takes the same id. motion carries the card from its place in the hand to the trick,
    shrinking on the way and always opaque.
  - Opponents' cards enter from their side (±170px), opaque.
  - `trick.flight`: a 0.3s tween, ease-out, no spring and no overshoot.
- Not touched: the computers' thinking time and the trick pause, which the human did not ask about.
- Redlines: constants in `theme/constants.ts` retuned on the human's ask; no dependency.
