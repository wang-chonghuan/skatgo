# SKATGO-81 handoff

## What changed

- **multiplayer**（`src/daily.ts` 的 `dailyBoard`）：
  - 改按 `daily_entries.total`（玩家的 Seeger-Fabian 总分）排名，同分时先打完的在前；
  - 「这是第几名」（`me.rank`）也按总分算；
  - `ai` 改为 `{ total }`，是 AI 在玩家座位上各副分数之和；
  - 不再读各副明细，返回的行和 `me` 都去掉了 `saldo`；不改表结构，不写库。
- **类型**（`app/src/lib/skat/tournament.ts`）：`BoardRow`、`DailyBoard.me` 去掉 `saldo`；`DailyBoard.ai` 改为 `{ total }`。`saldo()` 函数保留，记分单还在用。
- **web**：
  - 榜单（`daily-table.tsx`）：按总分插入 AI 行，显示总分，表头写「Punkte / Points」；「这是第几名」那句话用总分（「Deine Punkte: …」）；
  - `/daily` 每副一行（`daily-comparison.tsx` 的 `VsAiTable`）：你和 AI 的数字改为这一副自己座位的分数，表头写「Punkte」；
  - 每副打完后的那一行赛况（`game-table.tsx`）：用到目前为止的总分（「Nach n von 6 Spielen: Punkte … · AI …」）；
  - 记分单：保留三家分数和 Saldo 一列（还有「Saldo ?」的说明），Saldo 的字号从最大号降到和其他分数一样。
- **文案**（de/en）：
  - 新增 `daily_points`；`daily_after`、`daily_after_solo`、`daily_would_be` 改用 Punkte；
  - 「计分和排名」一段改为按 Seeger-Fabian 总分排名，AI 在榜上作对比；
  - 顺手改正了一处旧描述：原来写「榜单显示今天和昨天」，SKATGO-80 之后其实是最近 7 天。
- **charter**（人的决定，见 grill 第 5 条）：
  - product.md：按 Seeger-Fabian 总分排名和比较，AI 在榜上显示总分，Saldo 只留在记分单里作参考；
  - engineering.md：榜单按 `daily_entries.total` 排名，AI 显示总分；
  - ui.md：`ScoreSheet` 里 Saldo 只作参考、不比分数大；`VsAiTable` 每行显示 Punkte。

## AC results

全部在构建产物上验证：web 55081，multiplayer 56081，数据库 57081（全新的本地库）。
- **数据准备**：
  - 牌局由 `tmp/drive.mts` 走合法着法推进。6 副赛：Anna、Ben、Cora 打完并起了昵称，另有一名打完但没起昵称的玩家。12 副赛：Anna、Dora。
  - 两条「旧记录」由 `tmp/oldrecords.cjs` 直接写进数据库，不经过新代码：
    - Alt-Hoch：总分 120，Saldo −360；
    - Alt-Tief：总分 80，Saldo +560。
    
    按总分和按 Saldo 排，两条的先后正好相反。
- **检查方式**：Playwright 有头浏览器跑 `tmp/ac81.mjs`，桌面 1280×820 和手机 375×812 各一遍。期望值由 `tmp/expect.cjs` 只从数据库读出。

1. **榜单按总分** — PASS（两个视口）。
   - 6 副赛：`[AI +390]`、1 Alt-Hoch +120、2 Alt-Tief +80、3 Cora +40、4 Anna 0、4 Ben 0；
   - 12 副赛：1 Dora +40、2 Anna 0、`[AI −36]`；
   - 表头是「Punkte」；每个玩家的数都等于数据库里的 `total`；
   - AI 的数等于数据库里各副 AI 在玩家座位上的分数之和；
   - 两条旧记录按总分排：Alt-Hoch 在 Alt-Tief 之上。
2. **其他地方都用总分** — PASS（两个视口）。
   - `/daily` 每副一行：你 0,0,0,0,0,0，AI 170,0,98,122,0,0，等于每副自己座位的分数；表头两处都是「Punkte」。
   - 打完但没起昵称的玩家看到「Deine Punkte: 0. Das wäre heute Platz 4.」，名次按总分算出来也是第 4。
   - 每副打完后：新开一个测试玩家，用脚本打到最后一张牌，再在浏览器里点出最后一张，结算界面显示「Nach 2 von 6 Spielen: Punkte 0 · AI +170」，和数据库算出的一致。显示的是第 2 副，因为第 1 副大家都 pass 了，没有出牌就结束。
3. **记分单** — PASS（两个视口）。三家分数和 Saldo 都在（例：−73 / +340），Saldo 等于 2·自己 − 另外两家；Saldo 一格的字号是 16px，和分数一样。
4. **记录不变** — PASS。检查前导出的 8 条 `daily_entries` 在检查后逐字段相同。多出来的 4 条是结算检查新开的测试玩家打出来的。

机械检查全部通过：typecheck、build、104 个测试、client bundle、design tokens（121 个文件）、literal grep、SSR link、`check:seo --built`（42 个可索引页面、6 个 noindex）、`test:seo`；`npm --prefix multiplayer run check` 21/21。

## Deviations

- 多改了一处 plan 没写的文案：「计分和排名」里「显示今天和昨天」是 SKATGO-80 留下的旧描述，顺手改成了「最近 7 天」。

## Environment

- 实际端口：web 55081，multiplayer 56081，数据库 57081。
- 没有新增、修改或删除环境变量。本单的 `.env` 只把端口指到本单，本地数据库脚本写入了新的本地密码，这些不同步回 main。

## Residual

- **上线顺序：建议这次先部署 web，再部署 multiplayer。**
  - 如果先部署 multiplayer：在两次部署之间的几分钟里，线上的旧网页读的是行里的 `saldo`，新接口已经没有这个字段，榜上的数字会显示成「undefined」，AI 行也不出现。
  - 如果先部署 web：新网页读的是旧接口里本来就有的 `total`，只是那几分钟里排序还是按 Saldo，也没有 AI 行，但不会出现乱码。
  - operations.md 要求「先 multiplayer」，是为了让网页不去调用还没上线的路由。这次没有新路由，所以先部署 web 不违反那条的用意。
