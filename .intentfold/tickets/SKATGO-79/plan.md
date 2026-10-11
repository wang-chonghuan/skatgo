# SKATGO-79 plan

## 代码里有、工单没写的

- **三家分数都已存好：** 每副的三家分数在 `DealSummary.scores`，AI 那一局的在 `benchmarks[i].scores`。整个赛的三家合计就是逐副相加（`totals()` 已经这么算）。Saldo 不需要新数据，旧记录直接适用。
- **排行榜：** 现在在 SQL 里按 `total` 排（`dailyBoard`），改成读出每条记录的 `deals`、在代码里算 Saldo 再排；「这是第几名」也照此算。
- **当前结果弹窗**（`DealVsAi`）的问题：
  - 「你」和「AI」两行三家分数表样式完全一样；
  - 下面两段叫牌、打法的文字也一样；
  - 当天表（`VsAiTable`）每行是「你的分 / AI 的分 / Diff」。
- **SkatZero 能给出牌估值：** `policy.values(viewOf(g, seat))` 对当前每张合法牌打分，`choose` 取最高（必要时向前看一步）。叫牌、拿 Skat、扣牌、宣布走的是查表加 `score`，没有逐个选项的统一估值。
- **助手调模型可复用：** `lib/ask/azure.ts` 的 `openModelStream` 用的就是 `LLM_MODEL` 和 `LLM_EFFORT`（生产上是 `gpt-5.6-luna`、medium）；`lib/ask/limits.ts` 的 `admit` 是按访客限流。
- **待定：** 版式、身份色、「最差一处」怎么定义、解读存不存，见 grill。

## 路线

1. **规则层**（`tournament.ts`）：`saldo(scores) = 2·s0 − s1 − s2`，以及整个赛的三家合计；`BoardRow` 带 `saldo`。
2. **multiplayer**（`src/daily.ts`）：
   - 排行榜按 Saldo 排（同分时先打完的在前，和现在一样），返回 Saldo；「这是第几名」也按 Saldo 算。
   - 新增路由 `/daily/review {size, deal}`：只针对这个玩家已打完的一副，用他存下的着法重放；在他每次出牌时用 SkatZero 给所有合法牌估值，找出「最佳估值 − 实际所出那张的估值」最大的一步。返回这一步的事实：
     - 第几墩、他的位置和角色、合约；
     - 当时手牌、这一墩已出的牌、出了哪张、SkatZero 认为该出哪张；
     - 这一副的结果，以及同座位 AI 打出的结果。
     
     不会泄露未打完的副。
3. **web**：
   - `/api/daily/review` 经 `daily-handler` 转发拿到事实，再用 `openModelStream` 让 Luna 写两三句原因（页面的语言，德语用 Skat 术语）；用 `admit` 按访客限流。
   - 浏览器上点按钮才请求。
4. **界面**（`daily-comparison.tsx`、`game-table.tsx`、`daily-table.tsx`）：
   - 每副的记分单：「Du」和「AI」两行，列是你 / Lina / Max / Saldo，两行各用自己的身份色。
   - 每副下面放「最差一处」按钮和解读。
   - 当天表每行改成「你的 Saldo / AI 的 Saldo」，展开是这一副的记分单。
   - 赛的结果顶部放整个赛的记分单。
   - 排行榜显示 Saldo。
   - 去掉 Diff。
5. **设计值登记表**：两个身份色（需 grill 批准）。
6. **charter**：ui.md 写 `VsAiTable` 时规定了「差值只加粗、不用好/坏配色」，product.md 写的是每行有差值，这次都要改；交付时起草，人确认后改。

## 和工单建议方案的出入

- 「最差一处」只看出牌（理由见 grill 第 3 条）。
