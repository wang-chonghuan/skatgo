# SKATGO-57 plan

## 代码里已有、工单没说的

- **保存**：一副结束时，服务器已经在同一个事务里把摘要（`DealSummary`）写进 `daily_entries`，刷新不会丢。
- **玩家这边的步骤都存着**：玩家每一步、以及电脑的每一步，都在 `daily_entries.actions` 里（SkatZero 日为 `Logged[]`，旧启发式日为 `Move[]`）。
- **AI 那边的步骤也都存着**：AI 对照局的全部步骤在 `daily_deals.deals[i].benchmark.log`。
- **叫牌可以重放出来**：引擎的游戏状态 `game.bidding.log` 记着完整叫牌（谁叫、谁应、谁 pass、数值）。按上面存好的步骤重放就能得到，不需要新存一份，也不用让 AI 重打。人已同意这个做法。
- **两种结果面板**：
  - 自由对局和每日赛共用 `game-table.tsx` 的 `Result` 面板，每日赛只是往里塞了 `VsAiTable`；
  - 全员 pass 时是另一个对话框。
- **当天表**：`/daily` 当天页和结果页用的也是 `VsAiTable`。

## 路线

1. **引擎**（`tournament.ts`）：
   - 新增 `auctionOf(game)`：从叫牌记录得出三个座位各自的最高叫价（或直接 pass），以及最终叫价和庄家。
   - `DailyStatus` 新增 `auctions` 和 `benchmarkAuctions`，与 `deals` / `benchmarks` 一一对应。
2. **服务器**（`multiplayer/src/daily.ts` 的 `status()`）：
   - 每副已结束的牌，按存好的步骤重放出玩家这边和 AI 对照局的叫牌；
   - 读取时计算，不另存。重放只用引擎，每副几毫秒。
3. **每日赛的结果面板**（新组件，自由对局的 `Result` 不变），分三层：
   1. 本副结论：我的 SF 分、AI 的 SF 分、分差，大字；
   2. 两栏对比「我 / AI」：叫牌（三人各叫到多少或 pass）、庄家和定约、胜负和牌点、三人的 SF 分；
   3. 「详情」默认收起：局值计算、牌点拆分、底牌。

   当天累计表放在下面，默认收起。全员 pass 的那副也用同一块对比。
4. **当天表 `VsAiTable`**：展开的明细行加上叫牌。
5. 设计值只用现有注册表；如果需要新值，先问人。

## Redline 查对

- ui.md Redline 1：计划不新增设计值；如果开发中真需要，先停下问人。
- engineering.md：
  - 不加依赖；
  - 不手改生成文件；
  - 不放宽检查。
- operations.md：不碰生产数据，不需要重新发牌，也不删记录。
