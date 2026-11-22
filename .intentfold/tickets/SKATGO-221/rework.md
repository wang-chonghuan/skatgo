# SKATGO-221 rework

Against the frozen handoff (`530666a`).

## Round 1 — `f611c40`

The human: 「彩带的上面漏出来一个直角，不行。然后我考虑，让锦标赛卡片位于1，1，然后1 deal today位于2，2这个位置， 就是换位，你觉得如何？先改，然后思考这个决策」

- **The corner.** The 16px "Hot" made the ribbon thicker, and at 112px its cut end stopped short of the tile's top
  edge, so a corner of the band showed. `dims.ribbonWidth` 112px → 148px and `dims.ribbonRight` −30px → −48px, its
  middle where it was: every corner of the band now lies at least 9px outside the tile.
- **The swap.** The four colour cards read Ranked match (top left), Free play, Learn, 1 deal today (bottom right), on
  PC and phone; each keeps its colour. The deal of the day's click is still tracked as `primary`.
- **Ticket.** The ask added to Request, the swap to Scope, criteria 7 (no corner shows) and 8 (the order) added, with a
  comment. `ui.md` records the order and the ribbon's length.
- **Rechecked.** All criteria 1–8, EN and DE, PC and phone (the ribbon's corners measured, the order read from the
  page), and the full mechanical defence on the final code — pass.

## The decision after round 1 (no change)

Asked to think about the swap, the agent suggested the deal of the day in the top row (its players came back 3.4 days
in 14, free play's 1.6). The human: 「我同意。但是颜色要设计一下。我希望当前的颜色就不错，就是绿，红，橙，蓝。如果你改成绿，蓝，
橙，红。似乎不太协调。请你思考和建议，先别改，先讨论」. Four arrangements were compared as browser-only mock-ups; the human:
「很难决定，我觉得还是当前的， 颜色不变， 1 deal a day放到右下角」 — round 1's layout stands, nothing changed.

## Net effect against the handoff

The ribbon is longer (its visible part unchanged, no corner), and the League card is first, the deal of the day fourth.
