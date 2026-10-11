# SKATGO-79 rework

首次交付是 `22a3c32`（handoff.md 冻结在那里）。之后人提了 19 轮 rework，每轮一个提交，提交信息就是人的原话；下面把相关的几轮合在一起写。每轮只跑与改动有关的检查，脚本在 `tmp/`，牌局一律由脚本走合法着法推进。

## 各轮

1. **`33c1304` 复盘表**：「游戏详情不如改成复盘，10 墩，每墩谁出了什么，谁赢了」。双方叫牌和打法的文字换成 `TrickReplay`：每墩一行，三张牌按出牌顺序，谁赢、几分；最差一处所在那墩标出来。检查：`replay.mjs`，桌面和手机。
2. **`aa17a10` 自由对局也要**：multiplayer 加 `/free/review`，从对局 token 重放，什么都不存；结果里加复盘和最差一处。检查：`free.mjs`。
3. **`7dc2f5c` 结果简化**：每副打完只留记分单、一行赛况、下一副按钮和可展开的分析；删掉重复的叫牌、故事行和折叠的当天表。最早的三个需求都保留。检查：`simple.mjs`、`inventory.mjs`。
4. **`0998e42`、`152fc39`、`6c1b980` 牌桌比分颜色**：信息板上「几比几」的点数，玩家自己那一方的数字用琥珀色（和计分牌里玩家自己的分同色）。玩家是庄家就标庄家的数，是防家就标防家的数。检查：`board.mjs`，分别打一局庄家、一局防家。
5. **`fc5c60b` 结果弹窗**：「下一局」按钮上移；牌谱（Spielverlauf）直接展开，不折叠；按钮文案换成中性的说法；不出现「SkatZero」，只写「AI」；解读的语言跟随页面语言。检查：`record.mjs`，两种语言。
6. **`abce3cb` 用词、粉红行、改名**：改成「最值得改进的一手」；那墩用 `badSoft` 粉红底；电脑玩家 Max 全部改名 Noah（文案、助手上下文、注释）。检查：`noah.mjs`。
7. **`3c92c15` Ouvert 间距**：Ouvert 庄家摊开的牌用 claim 时的间距（`stage.stackStepOpen`），左右两边都改。检查：`ouvert*.mjs`，用 `find-ouvert.mts` 找出有 Ouvert 的牌局。
8. **`120d012` 解读把道理说反**：去掉阈值，按 10 墩排序选最差的一墩；把牌理作为事实交给模型。检查：`losses.mts`、`check-review.mts`。
9. **`e38c682` 删掉无用的段落，按钮更显眼**：只留一句结论；按钮改成提示用的蓝色（`info`）。检查：`button-look.mjs`。
10. **`049428d` 按钮文案**：改成「Where could I have done better?」/「Wo war mehr drin?」。
11. **`bc8bffb` 切换语言重新发牌**：自由对局切换语言时把 token 放进地址的 `#game=`，新页面用 `/free/resume` 接着打，读完就从地址里去掉；刷新页面仍是新的一局。检查：`locale-switch.mjs`、`locale-continue.mjs`。
12. **`39b86c3`、`6535e7c`、`3a18b08` 模型强度和开局手牌**：试过 Luna high 和 medium 两档，最后定 high；牌谱下加一行开局手牌。检查：`batch.mjs`（18 副同样的牌比对两档）、`hand.mjs`。
13. **`22ccf12` 每墩出牌前的手牌**：人认为解读太麻烦，同意不用模型，改为每墩直接显示 AI 的出牌。
    - 删掉 `lib/daily-review.ts`；`openModelStream` 和 `limits.ts` 恢复成 main 的样子；
    - `DealReview` 改成 `differs`：所有和 AI 不同的出牌，按差距从大到小排；
    - 每墩下面一行「出这墩前你的手牌」；点按钮后，在你的牌下面显示 AI 的牌，差得最多的那墩是粉红底。
    - AC4 已按此改写。检查：`trick-hands.mjs`。
14. **`630dcf8` AI 标记的位置、颜色，不用按钮**：先写 AI 的牌，再写标记，这样同一列竖着看全是牌；标记改成蓝色（`info`）；去掉按钮，打开就显示。AC4 已更新。检查：`trick-hands.mjs`，`/daily` 一行和自由对局，桌面和手机，全部通过。

## 关闭时一并做的

- **charter**：人授权「改所有 charter，移除不一致和矛盾的地方，写上最新的」。
  - `product.md`：Saldo、按 Saldo 排榜、记分单、牌谱（每墩手牌、AI 的牌、不用语言模型）、自由对局的牌谱、切换语言不丢对局；
  - `ui.md`：`ScoreSheet`、`VsAiTable`、`DealAnalysis` / `TrickReplay` 三行；颜色角色（`navy` / `tileOrange` 标身份，`info` 是 AI 标记，`badSoft` 是粉红行，信息板上的 `amber`）；Ouvert 的间距；
  - `engineering.md`：按 Saldo 排榜、SkatZero 复盘（`Policy.ranked`、`judgePlays`）、`/free/resume` 和切换语言时带走对局、文件职责；
  - `operations.md`：`/api/free/*` 的限流包括 resume 和 review；复盘在 multiplayer 上按请求计算，不存储。
- **`app/src/theme/table.stylex.ts` 注释**：「Max's」改成「Noah's」，人已批准（ui.md 红线 1）。只改注释，token 的值没动。

## 和冻结的 handoff 相比，最终的差别

- **结果**：每副打完是记分单、一行赛况、下一副按钮、牌谱。原来的叫牌和打法文字、折叠的分析和 Diff 都没有了。
- **最差一处**：不再有按钮，也不调用语言模型。牌谱打开就显示，按墩列出 AI 的牌和每墩出牌前的手牌，差得最多的那墩是粉红底，上面有一句话总结。handoff 里写的 `daily-review.ts`、`reviewTokens`、`openModelStream` 的 token 参数都已删掉。
- **新增**：
  - 自由对局的牌谱（`/free/review`）；
  - 切换语言时带走对局（`/free/resume`）；
  - 牌桌信息板上玩家自己一方的点数用琥珀色；
  - Ouvert 摊牌用更宽的间距；
  - 电脑玩家 Max 改名 Noah。
- **不变**：
  - 记分单（三家分数和 Saldo，玩家用 navy、AI 用 tileOrange 标签）；
  - 按 Saldo 排榜；
  - 旧记录一条不删，没有表结构迁移；
  - 环境变量没有增加、修改或删除。
- **上线顺序**：先 multiplayer（`/daily/review`、`/free/review`、`/free/resume` 和按 Saldo 排榜都在那边），再 web。
