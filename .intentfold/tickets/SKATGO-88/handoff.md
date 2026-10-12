# SKATGO-88 handoff

## What changed

- **multiplayer**：
  - `src/free.ts` 新增 `poolDealIndex(pool, dealer?)`：在牌池里随机抽一副，指定了发牌人时只在这位发牌人的牌里抽。
  - `/free/new` 接受可选的 `dealer`（0、1、2，zod strict），不带时照旧完全随机。
  - 私人牌桌（`src/room.ts`）原来自己写了一份按发牌人抽牌，现在改用 `poolDealIndex`，去掉了不再用的 `randomInt` 导入。
- **web 代理**（`app/src/lib/free-handler.ts`）：`/api/free/new` 原来丢掉请求体，现在只转发合法的 `dealer`，其他一概不转。
- **页面**：
  - `lib/free-api.ts`：
    - `freeNew(dealer?)`；
    - 换语言时，这一局的 token 和这一轮的进度一起放进网址（`#game=…&round=…`），新页面接过来后从网址里清掉。
  - `server-table.tsx`，只在自由对局：
    - 一轮 6 副（`ROUND_DEALS`），记下每副玩家和 AI 的 `DealSummary`；
    - 每副打完点「Nächstes Spiel」后，先把这一副记进这一轮（AI 那一副取自复盘），再用 `next(dealer)` 开下一副；第 1 副的发牌人由服务器随机抽；
    - 第 6 副之后显示「Deine Runde」：`VsAiTable` 每副一行，下面是整轮计分表，按钮「Neue Runde」和「Tisch verlassen」；
    - 每局的复盘只请求一次，结果和这一轮共用；
    - 第 11 课不分轮，照旧。
  - `game-table.tsx`：
    - `ServerGame.round`；牌桌上的药丸 `free-progress`「Spiel n von 6 · gesamt X」，和每日赛同款；
    - 结果和三家都 pass 时的按钮：第 1–5 副「Nächstes Spiel」，第 6 副「Zur Auswertung」；
    - `roundLast` 从外层组件一路传到结果组件。
  - 文案：`free_round_result`、`free_round_title`、`free_round_new`（de/en）。

## AC results

在构建产物上验证（web 55088，multiplayer 56088，数据库 57088），Playwright 有头浏览器 `tmp/ac.mts`。页面每次请求新局时，脚本把请求原样（带 `dealer`）转给服务器，再在同一个 token 上用合法着法推进到玩家只剩最后一张牌，然后交给页面；浏览器只打这最后一张。最后一轮全部 PASS。

1. **发牌人轮换** — PASS。桌面上完整打一轮：发牌人依次是 0、1、2、0、1、2；页面请求时带的 `dealer` 依次是随机、1、2、0、1、2。玩家的位置是 H、M、V、H、M、V，每个位置两次。另一次运行的发牌人是 2、0、1、2、0、1，同样通过。
2. **进度和一轮的结束** — PASS。
   - 药丸依次是 1/0、2/40、3/40、4/40、5/40、6/40，等于此前各副玩家 Seeger-Fabian 分的累计（各副分数是 40、0、0、0、0、0）。
   - 按钮前 5 副是「Nächstes Spiel」，第 6 副是「Zur Auswertung」。
   - 之后显示 6 行对比和整轮计分表；点「Neue Runde」后回到 1/0，第一副的发牌人又是随机抽的。
   - 第 11 课：没有进度药丸，按钮是「Noch ein Spiel」。
3. **换语言** — PASS。手机上打到第 3 副（这一副交给页面时没有推进），从牌桌的设置里切到英文：进度前后都是 3/0，药丸显示「Deal 3 of 6 · total 0」。此时累计分正好是 0，所以这一项能证明「第几副」被带了过去，证明不了「累计分」也被带过去。

机械防线全部通过：typecheck、build、115 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`、`test:seo` 25/25。`npm --prefix multiplayer run check` 21/21，私人牌桌的测试也包含在内。

## Deviations

- 「Deine Runde」上加了「Tisch verlassen」（白色，回首页，和牌桌上那个按钮去处一样）。不加的话这一屏只能开新一轮，没有离开的路。
- 第一次截图里白色面板被拉到了整屏高，改为只占内容的高度。
- 浏览器脚本改了几轮，都是脚本自己的问题，没有改产品代码：
  - 有的副交到页面时已经打完了；
  - 打完一墩的收牌遮罩挡住了点击；
  - 手机上有两个同名按钮；
  - 第 3 副要交一局还没打完的牌才能切语言。
- 已知的小瑕疵：点「Nächstes Spiel」后，新一副到来之前，药丸会先跳到下一个编号。

## Environment

- 实际端口：web 55088，multiplayer 56088，数据库 57088。
- 没有新增、修改或删除环境变量。

## Residual

- **charter 已过时，没改**（本单没有修改授权）：
  - `product.md`「Free play at `/play`: one game at a time …」应改为：一轮 6 副，发牌人顺延，打完显示和每日赛一样的整轮汇总。
  - `ui.md` 应补上：自由对局牌桌上的进度药丸和「Deine Runde」。
  - `engineering.md` 的 free-play 一节应补上：`/free/new` 可以带 `dealer`，一轮的进度只存在页面里。
