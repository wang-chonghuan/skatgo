# SKATGO-80 handoff

## What changed

- **multiplayer**（`src/daily.ts` 的 `dailyBoard`）：
  - 读出这一天、这个赛的 `daily_deals.deals`；
  - 每一副都有 `benchmark` 时，返回 `ai: { saldo }`，值是各副 AI 分数相加后按 Saldo 公式算出的整赛 Saldo；否则返回 `ai: null`；
  - 玩家行、名次、`own`、`me` 一概没动；不改表结构，也不写库。
- **类型**（`app/src/lib/skat/tournament.ts`）：`DailyBoard` 加了 `ai: { saldo } | null`。
- **web 榜单**（`app/src/components/skat/daily-table.tsx` 的 `Leaderboard`）：
  - AI 一行按 Saldo 插在玩家之间，同分时排在玩家后面；
  - 名次一格空着；昵称一格是记分单用的橙色「AI」标签（`Who`，从 `daily-comparison.tsx` 导出）；
  - AI 排在显示的 100 行之后时，和自己那行一起放在末尾；
  - 没人上榜时，保留原来那句话，下面显示 AI 一行。
- **charter**（人在 grill 第 5 条批准）：
  - product.md：AI 在榜上，对所有人可见，只显示总成绩，不占名次；
  - engineering.md：榜单计算里加上 AI 的 Saldo；「打完一副才能看到 AI 那一副」补上榜单这个例外；
  - ui.md：`tileOrange` 也用来标榜上的 AI 行；`good`/`bad` 颜色角色改成符合现状的写法（`goodSoft` 也用于已打开的开关、选中的牌组、榜上自己那行、完成的课程、助手里学习者的消息；`bad` 也用于拒绝和报错）。

## AC results

全部在构建产物上验证：web 55080，multiplayer 56080，数据库 57080（全新的本地库）。
- **数据准备**：
  - 牌局由 `tmp/drive.mts` 走合法着法推进（叫牌一律 pass，出牌按 `PICK` 取第一张、最后一张或中间一张）。6 副赛有 Anna、Ben、Cora 打完并起了昵称，12 副赛有 Anna、Dora。
  - 「昨天」（2026-10-10）用 `tmp/yesterday.cjs` 在本地库里造：
    - 6 副赛：复制今天的牌和玩家记录，再加一个测试玩家 Eva，她的各副成绩就是 AI 的成绩，所以和 AI 同分；
    - 12 副赛：复制时去掉每一副的 `benchmark`。
- **检查方式**：界面用 Playwright 有头浏览器跑 `tmp/board-ui.mjs`，桌面 1280×820 和手机 375×812 各一遍。

1. **两个榜都有 AI 一行** — PASS（两个视口）。没登录、没打过的访客看到：
   - 6 副今天：`[AI +176]`、1 Cora −486、2 Anna −510、2 Ben −510；
   - 6 副昨天：1 Eva +176、`[AI +176]`、2 Cora……（同分时 AI 排在玩家后面）；
   - 12 副今天：`[AI −292]`、1 Dora −719、2 Anna −907；
   - AI 一行名次为空，标签文字是「AI」，颜色是 `rgb(229, 111, 0)`（tileOrange）。
2. **AI 的 Saldo 算得对** — PASS。三个数完全一样：
   - 榜上的数；
   - 打完的玩家在 `/daily` 总记分单里 AI 那一行的 Saldo（`daily-vs-ai-total` 的 `data-ai`）；
   - `tmp/aisaldo.cjs` 只从数据库里各副的 `benchmark.summary.scores` 算出来的数。
   
   6 副赛是 176，12 副赛是 −292。
3. **没有 AI 成绩的日子** — PASS（两个视口）：12 副赛昨天照常显示 Dora 和 Anna，没有 AI 这一行。
   - 另外检查了「没人上榜但 AI 打过」：`tmp/empty.cjs` 把昨天 12 副的牌换回带 `benchmark` 的版本，并删掉那天的玩家记录；
   - 结果显示「Gestern stand niemand auf der Rangliste.」，下面是 AI 一行 −292。
4. **玩家记录不受影响** — PASS。
   - **榜单接口**：同一个数据库，分别用旧版 multiplayer（`dafd01d`，在临时工作区构建）和新版，以访客和每个玩家的身份读取 6/12 副 × 今天/昨天，共 20 个视角（`tmp/boards.sh`、`boards-base.json`、`boards-new2.json`）。新版除了多出 `ai` 字段外完全相同，名次和 `me`（「这是第几名」用的）也都一样。
   - **数据库**：检查前后各导出一次 `daily_entries`。差别只有 `empty.cjs` 有意删掉的昨天 12 副那两行，其余逐字段相同。本单的代码不写库。

机械检查全部通过：typecheck、build、104 个测试、client bundle、design tokens（121 个文件）、literal grep、SSR link、`check:seo --built`（42 个可索引页面、6 个 noindex）、`test:seo`；`npm --prefix multiplayer run check` 21/21。

## Deviations

无。plan.md 的路线是按 grill 的回答写的，照做了。

## Environment

- 实际端口：web 55080，multiplayer 56080，数据库 57080。
- 没有新增、修改或删除环境变量。本单的 `.env` 只把端口指到本单（`MULTIPLAYER_URL`、`DATABASE_URL` 的端口），本地数据库脚本写入了新的本地密码。这些不同步回 main。

## Residual

- **上线顺序**：先部署 multiplayer，再部署 web。旧网页会忽略多出来的 `ai` 字段，新网页在旧接口上 `ai` 为空，不显示 AI 行，两种顺序都不会出错，但先部署 multiplayer 才能让 web 一上线就显示 AI 行。
