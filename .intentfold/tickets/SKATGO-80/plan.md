# SKATGO-80 plan

## 代码里看到的（工单没写）
- **榜单的计算**：`multiplayer/src/daily.ts` 的 `dailyBoard` 从 `daily_entries` 里取出已打完并起了昵称的记录，按 `saldo(totals(deals))` 排名，同分时先打完的在前，最多返回 100 行（`BOARD_ROWS`）。自己那行在 100 名以外时单独放在 `own`。`me.rank` 是「这是第几名」用的。
- **AI 的成绩**：AI 在玩家座位上打的结果，发牌时已经算好，存在 `daily_deals.deals[i].benchmark.summary`。同一天同一个赛只有一份，所以 AI 的整赛 Saldo = `saldo(totals(各副 benchmark.summary))`，和 `/daily` 总记分单里 AI 那一行是同一个数。早期发的日子没有 `benchmark`，那就没有 AI 成绩。
- **charter 冲突**：engineering.md 规定，玩家打完某一副之前，不返回 AI 那一副的结果。人已决定榜上的 AI 总成绩对所有人可见，这条要补一个例外。
- **榜单的前端**：`daily-table.tsx` 的 `Leaderboard`，每行是名次、昵称、Saldo，自己那行用 `goodSoft` 底色；没人上榜时只显示一句话。
- **AI 标记**：`daily-comparison.tsx` 里的 `Who` 是记分单用的橙色「AI」标签，目前没有导出。

## 路线
1. **multiplayer**（`dailyBoard`）：
   - 读出这一天、这个赛的 `daily_deals.deals`；
   - 每一副都有 `benchmark` 时，返回 `ai: { saldo }`，否则返回 `ai: null`；
   - 不改玩家行、名次和 `me`，不改表结构。
2. **类型**（`tournament.ts`）：`DailyBoard` 加 `ai: { saldo: number } | null`。
3. **web**（`Leaderboard`）：
   - 把 AI 行按 Saldo 插进玩家中间；同分时排在玩家之后；
   - AI 不占名次，名次一格空着，昵称一格是橙色「AI」标签；
   - 如果 AI 排在显示出来的 100 行之后，就放在末尾；
   - 没人上榜时照样显示 AI 一行。
4. **charter**：product.md、engineering.md、ui.md 按人的决定改（grill 第 5 条）。
5. **部署顺序**：先 multiplayer，再 web。旧网页会忽略多出来的 `ai` 字段。
