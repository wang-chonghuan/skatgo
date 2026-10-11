# SKATGO-80 rework

首次交付是 `7e768d0`（handoff.md 冻结在那里）。之后有两轮 rework。

## `1743ea6` AI 标签统一用蓝色

人的原话：「AI标志都用app里那个蓝色的Ai标志，别搞橙色的」。

- `daily-comparison.tsx` 的 `Who`：AI 的标签从 `tileOrange` 改成 `info`（app 的蓝色）。这一个组件就覆盖了排行榜、记分单和对比表的表头。
- 牌谱里原来单独写的那份蓝色标签（`whoHint`）删掉，改用 `Who`。现在全站只有一种 AI 标签。
- `ui.md`：
  - `info` 的颜色角色写明：凡是标出 AI 的地方，都用它的「AI」标签；
  - `tileOrange` 只剩首页「课程」那张卡片；
  - `ScoreSheet` 一行里 AI 的标签改为 `info`。
- 重新检查：`tmp/board-ui.mjs`，桌面和手机。
  - AC1：4 个榜单视角里，AI 一行都是 `rgb(9, 94, 207)`，不占名次；
  - 玩家打完后的 `/daily` 页面上 9 个「AI」标签（对比表表头、各副记分单、总记分单、牌谱）全部是这个蓝色；
  - AC2 的三个数仍然一致；
  - typecheck、build、design tokens、literal grep 都通过。

## `59bba20` 榜单显示最近 7 天

人的原话：「等下，那个比赛成绩，要保留显示最近7天的，你当前只保持了2天。你设计ui。然后今天和昨天的数据，AI的要显示出来，如果需要重算数据你要算。这个算rework」。

- **先查数据**：生产库不接受外部连接，所以在 multiplayer 服务里跑了一次只读的 Render one-off job，查出所有日子每个赛的副数、带 AI 成绩的副数和上榜人数。
  - 结果：10-09、10-10、10-11 的 6 副赛，10-11 的 12 副赛，以及已经提前发好的 10-12，每一副都有 AI 的成绩（`benchmark`）。
  - 所以不需要重算。昨天（10-10）没有 12 副赛，因为 12 副赛是 10-11 才开始的。
  - 10-09 以前的日子在之前的工单里重新发牌时已经删掉了。
  - 旧数据本来就不会被删除，所以 7 天只需要改接口和界面。
- **multiplayer**：`/daily/board` 的 `day` 除了 `today`、`yesterday`（还没更新的旧页面会这样请求），还接受 0–6，表示往前数几天。上限是 `BOARD_DAYS = 7`（在 `tournament.ts` 里定义），超出就返回 400。
- **界面**（`Leaderboard`）：
  - 原来「Heute | Gestern」两个按钮改成标题旁的日期名，加右侧两个圆形箭头按钮；
  - 日期名显示「Heute」「Gestern」，更早的显示星期和日期（例如「Mi., 7. Okt.」/「Wed, Oct 7」）；
  - 左箭头往前一天，右箭头往后一天；到了第 7 天，或者回到今天时，对应的箭头变灰不可点；
  - 两个箭头固定在右边，日期名的长短不会让它们移动；
  - 没人上榜的日子新增文案「An diesem Tag stand niemand auf der Rangliste.」/「Nobody made the board that day.」。
- **charter**：
  - product.md：每天的榜可以看 7 天；
  - engineering.md：只有今天的牌能打或复盘，榜单可以读今天和之前 6 天；
  - ui.md：日期名加箭头的设计；去掉了「和榜单的 Heute | Gestern 一样的按钮」那句旧描述。
- **重新检查**：
  - 本地库里另造了 10-07（往前 4 天）的 6 副赛数据（`tmp/fourdays.cjs`）；
  - `tmp/days-ui.mjs`：桌面和手机，德语和英语，从今天点到第 7 天再点回来，32 项全部通过。每一天的日期、日期名、玩家和 AI 行（今天、昨天、10-07）、空榜文案、箭头是否可点、箭头位置不动，都检查了；
  - 接口：`today`、`yesterday`、0、1、4、6 都正确，7 返回 400；
  - `tmp/board-ui.mjs` 重跑，AC1–AC3 全部通过；
  - typecheck（app 和 multiplayer）、build、design tokens、literal grep 都通过。

## 和冻结的 handoff 相比

- AI 标签从橙色改成蓝色，全站统一。
- 榜单可以看最近 7 天，不再只有今天和昨天；接口兼容旧页面的请求。
- 生产数据已核对，不需要重算，也没有写入。环境变量没有变化。
