# SKATGO-87 handoff

## What changed

- **规则引擎**（`app/src/lib/skat/game.ts`）：
  - `Move` 的 bid 加了可选的 `to`；新增 `canJumpTo(g, to)`：只有报价方，且 `to` 在 `BID_LADDER` 里、高于当前值时成立。
  - `bidAction(g, action, to?)`：报价方说 `'bid'` 时取 `to ?? nextBid(b.value)`，`to` 不合法就保持原局面。
  - `applyMove`：只有报价方的 `'bid'` 可以带 `to`，别的动作带了一律无效。
  - 不带 `to` 的 `'bid'` 仍然是下一个值，所以旧记录照原样重放。
  - `skat.test.ts` 新增「jump bids」三条测试：跳叫后应叫方针对这个值回答；不带 `to` 的 bid 是下一个值；不在叫牌表上、不高于当前值、或不是报价方的 `to` 一律拒绝。
- **multiplayer**（`src/model.ts`）：`actionSchema` 的 bid 接受可选的整数 `to`。是否合法由引擎判断。每日赛、自由对局、私人牌桌都经过这里。
- **界面**（`game-table.tsx`）：
  - 报价方那一步改成独立组件 `SpeakerBid`：「{value} sagen」「Passe」「Höher …」，展开后的一排值，最后是「Tipp」。
  - 展开的一排列出下一个值之后的每一档，直到 264；不换行，横向滑动，样式复用 `styles.toggle` / `toggleOn`。
  - 点一个值是选中，再点一次取消；主按钮显示选中的值，点主按钮才叫出去。收起这一排时选中清空。
  - 应叫方，以及两家都 pass 后前手开叫，这两步不变。
  - `onBid` 带上 `to`。
- **文字**：
  - `bid_your_turn` 改为「… sag den nächsten Wert oder spring höher.」，英文同步；新增 `bid_higher`「Höher …」/「Higher …」、`bid_higher_values`（这一排的 aria-label）。
  - 规则页（`rules/content.{de,en}.ts`）原来写「bei SkatGo ist jedes Gebot der nächste Reizwert」，改为「Wer reizt, darf Werte überspringen – wie am echten Tisch … Bei SkatGo geht das mit „Höher …“」。
- **电脑、提示、课程**：都不变。电脑作为应叫方本来就按当前值决定跟或不跟，自己不跳叫。

## AC results

在构建产物上验证（web 55087，multiplayer 56087，数据库 57087），Playwright 有头浏览器 `tmp/ui.mjs`。每张牌桌由 `tmp/stage.mts` 预先准备到玩家报价的那一刻，测试时只点叫牌按钮。

1. **跳叫并看到回应** — PASS。桌面自由对局：「18 sagen」→ Höher → 一排 20…264，可以横向滑动 → 选 33 → 主按钮变成「33 sagen」→ 确认。返回的叫牌记录里，玩家是 `bid 33`，接下来座位 1 `hold 33`。
2. **各处都能跳叫** — PASS。
   - 手机自由对局：叫到 33 之后，座位 2 pass；展开这一排时手牌完全在屏幕内（375×812 截图 `phone-free-jump.png`）。
   - 第 11 课：叫到 33，座位 1 pass。
   - 每日赛（12 副赛第 1 副，浏览器带这台设备的 cookie）：叫到 33，座位 1 pass，经 `/api/daily/act` 记录。
3. **旧记录照常** — PASS。
   - 引擎测试：不带 `to` 的 bid 是下一个值。
   - `tmp/compat.mts`：先在本单之前的代码（main `d44c381`，叫牌部分和 `65a2433` 相同）上开一局自由对局，用不带 `to` 的「bid」叫过一手（叫牌记录 0:bid18, 2:pass, 1:bid20）；再开一条每日赛 6 副赛的记录，玩家用旧格式应叫了五次 hold。
   - 换成本单代码后，两者重放出的牌桌和改动前存下的完全一样；自由对局接着打，下一手被接受（revision 3 → 7）。
4. **规则页** — PASS。`/de/regeln` 已没有「jedes Gebot der nächste Reizwert」，写着「Werte überspringen」；`/en/rules` 同样。

机械防线全部通过：typecheck、build、115 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`（44 个可索引页面）、`test:seo` 25/25。`npm --prefix multiplayer run check` 21/21。

## Deviations

- `plan.md` 原本写这一排列到 168（SkatZero 叫牌表的上限），实际列到规则引擎叫牌表的最高值 264：这是正式规则下也能叫的值，电脑遇到超过自己上限的值只会 pass。`plan.md` 和 `grill.md` 已在交付前改正。
- 第一次看手机截图时，这一排在「Tipp」按钮下面。挪到「Höher …」正下方之后，只重跑了手机这一项，结果 PASS。
- 浏览器脚本第二次跑时，那副牌的当前值已经是 40，没有 33 可选，脚本因此停下。改为：没有 33 时选第三个值。

## Environment

- 实际端口：web 55087，multiplayer 56087，数据库 57087。
- 没有新增、修改或删除环境变量。

## Residual

- 「Tipp」暂不建议跳叫，课程里也没有教跳叫。以后要做的话另开工单。
