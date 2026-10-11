# SKATGO-79 handoff

## What changed

- **规则层**（`app/src/lib/skat/tournament.ts`）：
  - `saldo(scores) = 3·自己 − 三家合计`，即（自己 − 一家）+（自己 − 另一家）；
  - `WorstCard`、`DealReview` 两个类型；
  - `BoardRow` 和排行榜的 `me` 带上 `saldo`。
- **SkatZero**（`multiplayer/src/skatzero/policy.ts`）：把原来 `choose` 里「估值 + 向前看一步」的逻辑抽成 `weighed`，新增 `ranked(view)`，按 `choose` 的同一套权衡给每张合法牌打分。`choose` 的行为不变。
- **multiplayer**（`src/daily.ts`）：
  - **排行榜**：读出每条记录存着的 `deals`，算出整个赛三家合计的 Saldo，按它排名；同分时先打完的在前。「这是第几名」也按 Saldo 算。字段 `total` 保留，所以先部署 multiplayer 时旧网页照常显示。
  - **新路由 `/daily/review {size, deal}`**：只接受这个玩家已打完的副。用存下的着法重放（启发式日和记录日都支持），在玩家每次有得选的出牌时用 `ranked` 估值，取「最佳 − 实际所出」最大的一步；没有任何损失时 `worst` 为 null。返回的内容只有玩家自己的手牌和当时这一墩桌上的牌，外加这一副和 AI 那一副的结果、双方叫牌。
- **web**：
  - `lib/daily-handler.ts` 新增 `review` 操作：转发给 multiplayer，再用 `lib/daily-review.ts` 生成解读，计入助手现有的按访客和每日限流。被限流或模型不可用时 `text` 为 null，卡牌那一行照样显示。
  - `lib/daily-review.ts`：把事实按页面语言写成提示词（中文名称为德语或英语卡名、合约、角色、这一墩、手牌、出了哪张、SkatZero 会出哪张、两局结果），交给 `openModelStream`（Luna medium）写两三句。
  - `lib/ask/azure.ts` 的 `openModelStream` 增加可选的 token 上限参数，默认仍是 `answerTokens`（700）；`limits.ts` 增加 `reviewTokens: 2000`。
- **界面**（`daily-comparison.tsx`）：
  - **`ScoreSheet`**：表头是你的座位 / Lina / Max / Saldo。「Du」一行用海军蓝标签（`color.navy`），「AI」一行用橙色标签（`color.tileOrange`），都是现有主题色，没有新加颜色值。Saldo 一列加大并用竖线隔开；表下有一行说明 Saldo 怎么算。
  - **`DealVsAi`**：上面是记分单，下面是双方的叫牌和打法（标题换成同样的颜色标签），最后是「最差一处」按钮 `DealReviewButton`。同一页面里看过的解读按「日期 + 赛 + 第几副」缓存，不会重复请求。
  - **`VsAiTable`**：每行是「第几副 · 你的 Saldo · AI 的 Saldo」，展开就是这一副的 `DealVsAi`；底部的合计行换成整个赛的 `ScoreSheet`；Diff 列去掉。
  - 每副打完的结果（`game-table.tsx`，`Tournament` 加了 `day`）和 `/daily` 的结果、当天表都会传入 review 所需的信息。
  - **排行榜**（`daily-table.tsx`）：显示 Saldo，加了一行列名；「这是第几名」那句也用 Saldo。
- **文案**（de/en）：新增 Saldo、Saldo 说明、复盘相关的几条；「这是第几名」那句改成 Saldo；页面上「计分和排名」一段写明按 Saldo 排；删掉不再用的 Diff 和双方故事行的几条文案。

## AC results

全部在构建产物上验证：web 55079，multiplayer 56079，数据库 57079。牌局由 `tmp/drive.mts` 走合法着法推进（叫牌一律 pass；出牌按 `PICK` 取第一张、最后一张或中间一张合法牌）。界面用 Playwright 有头浏览器跑 `tmp/ui.mjs`，桌面 1280×820 和手机 375×812 各一遍；只有最后一张牌由浏览器点击打出，为的是让结果弹窗出现。

1. **每副的记分单** — PASS（两个视口）。
   - 「Du」行 0/0/+72，Saldo −72；「AI」行 +122/0/0，Saldo +244。两行都等于服务器回复里的 `deals[0].scores` 和 `benchmarks[0].scores`，Saldo 都等于 2·自己 − Lina − Max。
   - 标签计算后的颜色是 `rgb(2, 38, 87)`（navy）和 `rgb(229, 111, 0)`（tileOrange）。
   - 结果里没有 Diff。
2. **整个赛的记分单** — PASS（两个视口）。用 `d27de36` 生成的旧记录 AltErst 打开 `/daily`：
   - 「Du」行 +40/+134/+290，Saldo −344；
   - 「AI」行 +316/+83/+292，Saldo +257。
   
   两行都等于逐副相加，Saldo 按同一公式算。
3. **排行榜按 Saldo** — PASS（两个视口）。
   - 三条旧记录（用 `d27de36` 生成）按旧算法：AltErst 40（第 1）、AltLetzt 0 和 AltMitte 0（并列第 2）。
   - 新榜按 Saldo：AltErst −344（第 1）、AltMitte −636（第 2）、AltLetzt −660（第 3），页面显示的就是 Saldo。
   - 数据库：三条旧记录在新代码运行前后逐字段完全相同（`tmp/entries-before.json` 和 `entries-after.json`）。多出的两行是验收用的新玩家。「before」快照是新 multiplayer 启动之后、收到任何请求之前取的：原定切换前就取，但脚本当时找不到 `pg` 包而失败。本单没有表结构迁移，期间也没有写入。
4. **最差一处按钮** — PASS。
   - **不点不请求**：结果出来、按钮未点时，没有发出 review 请求；`/daily` 展开某一行时也不会自动请求。
   - **点了显示**：第 9 墩，你出了 ♣A，SkatZero 会出 ♣7，下面是一段解读。
   - **定位正确**：`tmp/check-review.mts` 不经过 `dailyReview`，逐步重放存下的着法，独立用 SkatZero 估值，两个玩家算出的都是第 9 墩、CA 换成 C7，和页面一致。
   - **第一次手机检查失败**：页面显示「解读暂时不可用」。原因是 Luna medium 的推理 token 也计入上限（实测一段两三句要 175–512 个），700 的上限有时不够写正文。给解读单设 2000 的上限后，`tmp/review.mjs` 在两个视口的 `/daily` 行里都拿到了解读，API 连续 5 次也都有解读。

机械防线全部通过：typecheck、build、104 个测试、client bundle、design tokens（122 个文件）、literal grep、SSR link、`check:seo --built`（42 个可索引页面、6 个 noindex）、`test:seo` 25/25。`npm --prefix multiplayer run check` 21/21。

## Deviations

- **ac.md 原写「两行身份色」要加新颜色**：按 grill 第 2 条改用现有的 navy 和 tileOrange，没有改设计值登记表。
- **整个赛的记分单放在当天表的底部**，没有像 plan.md 写的那样放在结果顶部：它替换了原来的合计行，读起来就像 Skat 记分单最下面的合计。
- **多出两处 plan 没写的改动**：
  - `openModelStream` 增加了 token 上限参数，原因见 AC4；
  - 页面「计分和排名」一段写明按 Saldo 排。

## Environment

- 实际端口：web 55079，multiplayer 56079，数据库 57079。
- 没有新增、修改或删除环境变量。本单的 `.env` 只把端口指到本单，本地数据库脚本写入了新的本地密码，这些不同步回 main。
- 解读用的就是助手现有的 `LLM_*` 配置，生产上不需要新的配置项。

## Residual

- **charter 待人确认的修改**（人和 agent 都不能自行改 product.md）：
  - `product.md` 第 24 行写着每行给出「both Seeger-Fabian scores with each side's role and the difference」。建议改为：「each row gives both sides' Saldo — how far the player's seat is ahead of the two opponents, (own − one) + (own − other), SKATGO-79 — with each side's role; opened, it shows the deal's score sheet of all three seats for the player's deal and the AI's, and offers the player's worst card in that deal, found by SkatZero and explained on request by the assistant's model」。第 20 行「a leaderboard for each tournament」后面补「, ranked by Saldo」。
  - `ui.md` 第 198 行 `VsAiTable`：把「the difference, signed and bold, never good/bad」改成 Saldo 和记分单的说法，并补一句：你是 `color.navy` 标签，AI 是 `color.tileOrange` 标签（人 2026-10-11 指定用主题色）；底部是整个赛的记分单；每副有「最差一处」按钮。
  - `engineering.md`：
    - 排行榜那句改为「each tournament's leaderboard is computed from those rows on request, ranked by Saldo」；
    - `daily-comparison.tsx` 的职责里加上 `ScoreSheet` 和复盘；
    - 文件表里加上 `app/src/lib/daily-review.ts`（解读的提示词）；
    - 加一条 Key decision：最差一处由 SkatZero 决定，模型只负责解释。
- **上线**：先部署 multiplayer。新的 `/daily/review` 路由和按 Saldo 排的榜都在那边；旧网页仍读得到 `total`。再部署 web。没有表结构变更。
