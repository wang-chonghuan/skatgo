# SKATGO-98 plan

1. `value.ts`：`highestValue`（打出 Schneider 和 Schwarz 后的最高价值）、`mayDeclare`（ISkO 3.4.2–3.4.4）；Null 结算在价值低于叫价时判输。
2. `game.ts`：`mayAnnounce(g, d)`，按庄家能看到的牌判断（Hand 局只看手里十张）。
3. multiplayer：`refuseUnlawful` 用在自由对局、每日赛（两种电脑）、好友牌桌的新动作上；`computers.ts` 给 SkatZero 的宣布加 `lawful` 兜底。
4. `ai.ts`：`declarationAdvice` 可选 `allowed` 过滤，不传时排序与原来完全一样；提示传入 `mayAnnounce`。
5. 定约弹窗：
   - 格子按「宣布后最多能到多少」判断，不允许就禁用；
   - 「Das spiele ich」按所选的定约判断；
   - 说明句按情况选一句。
6. 测试：结算、可宣布规则的单元测试；API 和浏览器验收。
