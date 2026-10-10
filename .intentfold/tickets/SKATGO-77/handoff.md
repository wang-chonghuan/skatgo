# SKATGO-77 handoff

## What changed

- **规则层**（`app/src/lib/skat/tournament.ts`）：每日赛长度从一个常量变成两个赛 `DAILY_SIZES = [6, 12]`，`DAILY_DEALS` 是默认赛 6；`DailyStatus.of` 是赛的副数。
- **multiplayer**：
  - `src/store.ts` 迁移：`daily_deals`、`daily_entries` 加 `size integer NOT NULL DEFAULT 6`；主键改为 `(day, size)`、`(day, size, player)`，外键 `(day, size)`。只在主键还没有 `size` 时改，可重复运行。默认值 6 让已有记录归入 6 副赛，也让上线重叠期间旧版本的写入落在 6 副赛。
  - `src/daily.ts`：
    - 每个赛各自发牌、各自 10 分钟上限，`prepareDays` 依次准备今天 6、今天 12、明天 6、明天 12；
    - 所有路由接受可选的 `size`，缺省为 6；
    - 结算循环用这套牌的长度；
    - 登录认领按赛分别转；
    - 排行榜和昵称按赛；
    - 12 副赛的 skat 尝试顺序种子加了 `|12`，6 副赛不变。
- **网页**：
  - `/daily` 和 `/daily/play` 用 search 参数 `deals=12` 选赛，缺省 6（`routes/daily.tsx`、`routes/daily_.play.tsx`）。
  - `daily-page.tsx`：h1 下面加切换「6 Spiele | 12 Spiele」，服务端也渲染；切换用按钮改网址（replace），不产生新的内部链接。切换按钮复用原来「Heute / Gestern」的样式，抽成 `Toggle`，排行榜也改用它。
  - `daily-table.tsx`：入口、结果、昵称、排行榜、牌桌都带上所选的赛；打完回到同一个赛。
  - `daily-api.ts`：每个调用带 `size`；`daily-handler.ts` 没改，body 原样转发。
  - 文案（de/en）：
    - h1「Das tägliche Skat-Turnier: {short} oder {long} Spiele」，英文「The daily Skat tournament: …」；
    - 每日赛页元描述、首页元描述、说明里的副数改成「6 oder 12」；
    - 「每人每天一轮」改成「每个赛每天一轮」；
    - 「每个赛有自己的排行榜」。
  - 埋点：`daily_started`、`daily_finished` 加属性 `deals`；`analytics.test.ts` 里「无属性事件」的例子改用 `daily_nickname_set`，断言不变。
  - 分享预览图 `app/public/og/daily-{de,en}.png` 按新 h1 重画（SKATGO-50 的 `og.mjs`）。

## AC results

全部在构建产物上验证：web 55077，multiplayer 56077，数据库 57077。牌局一律由 `tmp/drive.mts` 走合法着法推进（每次叫牌都 pass，出第一张合法牌）。界面用 Playwright 有头浏览器 `tmp/ui.mjs`，桌面 1280×820 和手机 375×812 各跑一遍，18 项全部 PASS。

1. **两个入口，进度分别是 6 和 12** — PASS。
   - 两个视口下，h1 是「Das tägliche Skat-Turnier: 6 oder 12 Spiele」；切换「6 Spiele / 12 Spiele」，默认选中 6。
   - 点开始，牌桌显示「Spiel 1 von 6 · gesamt 0」。
   - 切到 12（网址 `?deals=12`）再点开始，牌桌显示「Spiel 1 von 12 · gesamt 0」。
2. **同一个人两个赛都能打，两个榜互不影响** — PASS。
   - 设备 A 先打完 6 副赛，昵称「Beide」，总分 0；再打完 12 副赛，同一个昵称，总分 80。
   - 打 12 副赛前后，6 副赛都是 `{"of":6,"finished":true,"total":0}`。
   - 页面上，6 副赛的榜是 `[AltSechs 0, Beide 0 (me)]`，等于结果 0；12 副赛的榜是 `[Beide 80 (me)]`，等于结果 80，没有 AltSechs。
3. **同一天 12 副赛牌相同、和 6 副赛不同** — PASS。
   - 设备 B、C 打开今天的 12 副赛，第 1 副发牌人都是 0，手牌相同：K♣ 9♠ J♥ 8♦ A♠ 7♥ 10♥ 7♦ 10♠ J♦。
   - 设备 B 的 6 副赛第 1 副是 10♦ 7♥ 8♦ 8♥ K♣ 8♠ 9♣ A♥ Q♥ Q♦，不同。
4. **已有记录归入 6 副赛** — PASS。
   - 先用 `c783c13`（本单之前的 main）的 multiplayer 在 57077 发今天的牌，并打完一条记录，昵称「AltSechs」，总分 0。当时的表结构是 `PRIMARY KEY (day)`、`PRIMARY KEY (day, player)`、`FOREIGN KEY (day)`。
   - 再启动本单代码：迁移后是 `PRIMARY KEY (day, size)`、`PRIMARY KEY (day, size, player)`、`FOREIGN KEY (day, size)`。那条记录 `size = 6`、昵称和总分不变；随后补发了今天和明天的 12 副赛，本机各约 30 秒，6 副赛约 15 秒。
   - 页面上，这个设备的 6 副赛显示已打完的结果，榜上有「AltSechs 0 (me)」；切到 12 副赛，显示的是开始按钮。
   - 重启本单的 multiplayer，迁移再跑一遍，没有报错，服务正常就绪。

机械防线（engineering.md）全部通过：typecheck、build、104 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`（42 个可索引页面、6 个 noindex）、`test:seo` 25/25。`npm --prefix multiplayer run check` 21/21。

## Deviations

- 和 `plan.md` 一致。
- 切换按钮没有新加 token：原来排行榜「Heute / Gestern」的切换样式抽成 `Toggle`（`daily-page.tsx`），两处共用。
- `ac.md` 写的是 AC3「发牌人相同时」比较手牌；实际两人第 1 副发牌人都是 0，直接比较了。

## Environment

- 实际端口：web 55077，multiplayer 56077，数据库 57077。
- 没有新增、修改或删除环境变量。工作目录里 `app/.env` 的 `MULTIPLAYER_URL`、`multiplayer/.env` 的 `DATABASE_URL` 只是指向本单端口的本地值，本地数据库脚本建新容器时写入了新的本地密码。这些不是本单的配置变更，不同步回 main。

## Residual

- **上线**：
  - 先部署 multiplayer。启动时迁移会改生产表结构，人已在 grill 第 3 条同意。随后约 6 分钟里，今天的 12 副赛显示「正在准备」。
  - 再部署 web。
  - 上线后用 Render 日志里 `daily_prepared` 的 `size: 12` 记录实测发牌时间，写进 operations.md。
- **charter 待人确认的修改**（grill 第 4 条：agent 起草，人确认后再改）：
  - `product.md` 第 17–18 行，改为：「A daily Skat tournament at `/daily`, in two lengths (SKATGO-77): every day the same 6 deals for every player (SKATGO-62), shown first, and separately the same 12 deals for every player, each played against two computer players and scored by Seeger-Fabian; one entry per player per tournament per day, and a leaderboard for each; scores are the server's, from the cards actually played.」
  - `engineering.md`「The daily tournament runs in `multiplayer/`」那条：`daily_deals` 和 `daily_entries` 后面加「keyed by the day and the tournament's size, 6 or 12 deals (SKATGO-77)」。
  - `operations.md` 发牌时间那句：改为「Each tournament is prepared on its own, today's and tomorrow's: 6 deals take about 15–16 s on a laptop and about 3 min on the production instance (measured 2026-10-09); 12 deals about 30 s on a laptop (2026-10-10) and <生产实测> on production.」
  - `ui.md` 的 `VsAiTable` 一行：「On `/daily` while the day runs」后面补「for the chosen tournament (a switch `6 Spiele | 12 Spiele` above it, SKATGO-77)」。
