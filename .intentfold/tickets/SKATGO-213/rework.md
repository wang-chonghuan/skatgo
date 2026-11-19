# SKATGO-213 rework

One round after the frozen handoff.

1. **「gold的不行，那个红色带子在橙色背景上看不清」** (6ac6354). The bronze medal's red ribbon is as bright as the gold
   card's orange (luma about 125 against 122), so it vanished. Gold's ribbon is now a deep crimson (hue 352, its
   lightness 0.6 of the red's), on the gold card and on the gold badge alike, so card and badge stay one emblem; Bronze
   and Silver keep the red. Charter `ui.md` updated; `tmp/ac.mts`'s gold ribbon test reads the crimson. Rechecked: AC1
   (gold card: crimson ribbon 3376 px, yellow metal 12528), AC3 (gold card ground and sparkles), AC4 (first load after
   the release shows this build's pictures) — passed.

Net effect against the handoff: the Gold card's and the gold badge's ribbon is deep crimson instead of red.
