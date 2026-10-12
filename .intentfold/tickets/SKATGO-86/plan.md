# SKATGO-86 plan

## 代码里有、工单没写的

- **`/free/review`**（`multiplayer/src/free.ts`）已经在打完后当场让 SkatZero 复盘，不存任何东西。它返回的 `DealReview` 本来就有 `ai`、`aiAuction` 两个字段，每日赛会填上，自由对局一直是 `null`。
- **牌池**里 1000 副牌都存了座位 0、1、2 三份叫牌计划。`computers.ts` 的 `computerTurn` 和 `advance(…, toEnd = true)` 就是每日赛 `benchmark` 用的那套打法，可以直接用。
- **`/free/review` 现在拒绝三家都 pass 的局**（只接受 `done`）。但 AI 坐玩家座位时可能会叫牌，所以这种局也要能算。
- **第 11 课**：`server-table.tsx` 只给 `mode === 'free'` 提供复盘（SKATGO-79 写明「not lesson 11」）。人说「同一个牌桌」，第 11 课要一起做。
- **自由对局结果现在的样子**：一个胜负面板，里面是标题、这局是什么、游戏分；然后「下一局」；然后 `DealAnalysis`，它自己请求复盘。每日赛结算用 `DealVsAi`（`ScoreSheet`），三个座位都是 Seeger-Fabian 分。

## 路线

1. **multiplayer `/free/review`**：
   - 接受 `done` 和 `passedIn` 两种结束状态。
   - 按牌池的三份计划，用 `computerTurn` 和 `advance(toEnd)` 把整副牌打完，结果填进 `ai: summarize(end)` 和 `aiAuction`。
   - 当场算，不存。
2. **web**：
   - **结果组件**（`game-table.tsx` 的 `Result`）只发一次复盘请求，分数表和 Spielverlauf 共用这个结果。
   - **分数表**：新组件 `FreeVsAi`（在 `daily-comparison.tsx`），用 `DealVsAi` 显示「你 / AI」两行 Seeger-Fabian 分；AI 那一行没出来时显示加载提示，失败时显示失败提示。
   - **胜负面板**：保留标题和提前结束那一行，原来的这局是什么、游戏分两行由分数表代替。
   - **三家都 pass**：对话框里也显示 `FreeVsAi`。
   - **第 11 课**：`server-table.tsx` 的复盘不再只限自由对局，第 11 课也有。
3. **文案**：新增 `free_ai_loading`、`free_ai_failed`（de/en）。
4. **测试**：`multiplayer/test/free.test.ts` 加一条：打完的局复盘带 `ai`，且两次请求结果相同；三家都 pass 的局也能复盘。

## 和工单建议方案的出入

无。并进了现有的 `/free/review`，没有另开接口。
