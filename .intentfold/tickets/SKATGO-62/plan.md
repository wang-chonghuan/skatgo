# SKATGO-62 plan

## 代码里已有、工单没说的

- **副数只有一个常量**：`app/src/lib/skat/tournament.ts` 的 `DAILY_DEALS = 12`。
  - 服务端用它发牌、校验副号、判断一天打完（`multiplayer/src/daily.ts`）；
  - 页面的标题、描述、介绍、「第 n 副，共 m 副」都通过参数引用它，文案里没有写死的 12。
- **写死「12」的只有每日赛的分享预览图**（`app/public/og/daily-{de,en}.png`，标题「12 Spiele」）。图是 SKATGO-50 的 `og.mjs` 按页面 H1 画的，可以重画。
- **座位轮转**：`dealDay()` 让发牌人每副顺时针换一个，所以 6 副时玩家在每个位置各坐两次（原来四次）。代码里那句注释要跟着改。
- **线上的日子**：今天和明天在部署时已经是 12 副。按人的新指示，部署后删除线上所有每日赛记录和牌局（SKATGO-48 的先例：Render 一次性任务，先空跑再删除）。删完后一次请求就会触发重新发牌，生产上每天约 3 分钟。
- **charter 过时（不改，交给人）**：`product.md` 写着「every day the same 12 deals」。

## 路线

1. `DAILY_DEALS = 6`。把 `daily.ts` 里「每个位置四次」的注释改成两次。
2. 用 `.intentfold/tickets/SKATGO-50/og.mjs` 从本地构建重画 `/de/taeglich`、`/en/daily` 的预览图。
3. 跑单元测试和 multiplayer check。本地新库会按 6 副发牌，用来验收。
4. 部署时（cap4，经人批准）的顺序：
   1. 先部署 multiplayer；
   2. 用 Render 一次性任务空跑，再删除所有 `daily_entries` 和 `daily_deals`；
   3. 发一次请求触发重新发牌，用只读任务确认今天和明天都是 6 副、没有旧记录；
   4. 再部署 web，跑部署后检查。

## Redline 查对

- **operations.md Redline 2**（验收检查不得修改生产数据）：验收只在本地做。生产删除不属于验收，是人明确授权的数据操作，部署时执行。
- **operations.md Redline 5**：不改表结构，不加环境变量，不改服务配置。
- **ui.md / engineering.md**：不加设计值，不加依赖。预览图由脚本生成，不手画。
