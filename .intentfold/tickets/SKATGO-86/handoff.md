# SKATGO-86 handoff

## What changed

- **multiplayer `/free/review`**（`src/free.ts`）：
  - 打完一局后，用牌池里三个座位的叫牌计划，以 `computerTurn` 和 `advance(toEnd)` 让 SkatZero 把同一副牌打完，结果填进 `ai`（`summarize`）和 `aiAuction`。每次请求当场算，不存。
  - 三家都 pass 的局（`passedIn`）现在也能请求复盘。
  - AI 没打完时，请求以 `computer_unavailable` 失败。
- **web**：
  - `daily-comparison.tsx` 新增 `FreeVsAi`：用 `DealVsAi`/`ScoreSheet` 显示「你 / AI」两行，三个座位都是 Seeger-Fabian 分。AI 一行未到时显示 `free_ai_loading`，失败时显示 `free_ai_failed`（`role="alert"`）。`data-state` 取值 loading、ready、failed。
  - `game-table.tsx` 的 `Result`：
    - 复盘只请求一次，分数表和 Spielverlauf 共用这个结果；
    - 胜负面板里只留标题和提前结束那一行，原来的「这局是什么 / 游戏分」两行由分数表代替；
    - 三家都 pass 的对话框里也显示 `FreeVsAi`。
  - `server-table.tsx`：复盘不再只限自由对局，第 11 课的整局也有。
  - 文案：`free_ai_loading`、`free_ai_failed`（de/en）。

## AC results

在构建产物上验证：web 55086，multiplayer 56086，数据库 57086。牌局由 `tmp/stage.mts` 和 `tmp/api.mts` 走合法着法推进（每次叫牌都 pass，出第一张合法牌）。浏览器只打最后一张：页面请求新局时，`tmp/ac.mjs` 用 Playwright 的 route 把准备好的局交给牌桌。Playwright 有头浏览器。

1. **打完后的分数表** — PASS。
   - **自由对局**（桌面和手机）、**第 11 课**（桌面）：分数表里「你」和 AI 两行的分数，与这一局 `/api/free/review` 返回的 `mine.scores` 和 `ai.scores` 完全一致，两行下面都有这局是什么的说明。例如手机上：Du 40,40,−94「Noah: Pik ♠ (18) · verloren 47:73」，AI 0,0,72「Noah: Pik ♠ (18) · gewonnen 72:48」。Spielverlauf 也在。
   - **三家都 pass**（API）：玩家「all passed」，AI 坐同一个位置时是「declarer 0 suit bid 18 won 105:15 scores 86 0 0」。
2. **重复请求结果一致** — PASS。同一个 token 连续请求两次，`ai` 完全相同；本机耗时 40 ms 和 39 ms。
3. **加载和失败** — PASS。
   - 把 review 请求延后 4 秒：先显示「Die AI spielt dieses Spiel gerade von deinem Platz aus …」，「你」那一行已经在，「Noch ein Spiel」可以点；随后 AI 那一行出来。
   - 让 review 返回 503：显示「Das Spiel der AI ließ sich gerade nicht berechnen.」，只剩「你」那一行，「Noch ein Spiel」可以点。

浏览器脚本跑过四次：
- 第一次在第 11 课超时，原因是脚本在整局那一步继续点已禁用的「继续」，修了脚本；
- 第二次在手机自由对局点最后一张牌时超时，同样的脚本重跑就通过了，没有改代码；
- 第三次只是重新准备牌局；
- 第四次 9 项全部 PASS。

机械防线全部通过：typecheck、build、112 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`（44 个可索引页面）、`test:seo` 25/25。`npm --prefix multiplayer run check` 21/21。

## Deviations

- `plan.md` 计划在 `multiplayer/test/free.test.ts` 加一条接口测试，没有加：路由要加载 ONNX 模型才能跑，这一点改由运行中的服务按 AC1、AC2 验证（`tmp/api.mts`）。
- 没有另开接口，并进了 `/free/review`（工单建议方案里的选项之一）。

## Environment

- 实际端口：web 55086，multiplayer 56086，数据库 57086。
- 没有新增、修改或删除环境变量。

## Residual

- **charter 已过时，没改**：本单没有修改 charter 的授权，需要人决定：
  - `product.md`「A finished game shows its result, the way to the next game, and the same play record」应补上：分数表里有 AI 从玩家座位打同一副牌的结果，双方都用 Seeger-Fabian；第 11 课的整局也一样。
  - `ui.md` 的 `ScoreSheet` 和 `DealAnalysis` 两行应补上：自由对局和第 11 课也用它们。
  - `engineering.md`「`/free/review` … store nothing」那句应补上：它也算 AI 的一局。
