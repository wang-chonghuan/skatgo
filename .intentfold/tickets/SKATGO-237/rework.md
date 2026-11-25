# SKATGO-237 rework

## Round 1 — 「你再调整一下当前玩家的数据，就是联赛玩家的，确保他们这个进度不变，分数按百分比换算。然后合并上线」
- Changed: the multiplayer migration multiplies every League row on scale 5 by 2/3 to a whole number and moves it to
  scale 6 (tier and coins kept, once); new accounts still start at 1500. The League test covers a scale-5 row
  (2096 → 1397) and the whole chain of earlier scales; charter product.md and engineering.md say so; the live ticket's
  AC 5 and proposed solution were amended with a comment.
- Rechecked: AC 5 — League multiplayer test passes; on the ticket DB a restart rescaled 2400 → 1600 and 1500 → 1000 at
  scale 6. AC 1–4 unaffected (the rule and page are unchanged).
- Net effect against the handoff: existing points are no longer kept as they were — each player's progress to the
  promotion line is kept instead, so nobody is promoted by the change itself (the Gold player at 2096 becomes 1397).
