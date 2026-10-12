# SKATGO-88 plan

## 代码里有、工单没写的

- **服务器开局**：`multiplayer/src/free.ts` 的 `/free/new` 每次随机抽一副牌池里的牌，发牌人就是这副牌自带的那个。牌池 1000 副，三个发牌人各占约三分之一。私人牌桌的 `pick(dealer)`（`src/room.ts`）已经按发牌人抽牌。
- **页面**：
  - `ServerTable`（`server-table.tsx`）只拿着当前这一局的 token；一局打完，`next` 就开新局。
  - 换语言时，当前这一局的 token 放进网址的 `#game=` 带过去（SKATGO-79）；刷新页面会开新局。
- **第 11 课**：用的是同一个 `ServerTable`（`mode="lesson"`），一局打完就算这一课完成。
- **可复用的显示**：每日赛牌桌上的「Spiel n von m · gesamt X」药丸（`daily-progress`）、每副一行的对比表 `VsAiTable`、整轮的 `ScoreSheet`。自由对局的结果里已经有每副的玩家分和 AI 分（SKATGO-86）。

## 路线

1. **服务器**：`/free/new` 接受可选的 `dealer`（0、1、2），只从这个发牌人的牌里随机抽；不带时照旧随机抽。和私人牌桌共用一个按发牌人抽牌的函数。
2. **页面里的一轮**（只在自由对局；第 11 课不变）：
   - `ServerTable` 记住这一轮：第几副、这一副的发牌人、已打完各副的结果（玩家和 AI 的 Seeger-Fabian 分）。
   - 第 1 副由服务器随机发牌，之后每副的发牌人是上一副的下一家。
   - 「下一局」开的是这一轮的下一副；第 6 副之后按 grill 定的方式结束这一轮。
3. **显示**：按 grill 定。
4. **换语言**：按 grill 定。

## 和工单建议方案的出入

无。
