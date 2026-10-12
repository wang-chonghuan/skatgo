# SKATGO-88 rework

相对冻结的 `handoff.md`，交付后人提出一轮修改，一个提交。

## 「charter这次一起改了」

- **改了什么**：只改了 charter，没有改代码。把 SKATGO-86、SKATGO-87、SKATGO-88 三单带来的变化写进四个 charter 文件：
  - `product.md`：
    - 自由对局一轮 6 副，发牌人顺延，每个位置各坐两次；
    - 牌桌显示第几副和累计分；
    - 每副后是你和 AI 两行 Seeger-Fabian 计分表，第 6 副后是整轮汇总和新一轮；
    - 第 11 课是一局，结果相同；
    - 换语言保留这一轮，刷新开新一轮。
  - `engineering.md`：
    - `/free/review` 也返回 AI 那一局（`DealReview.ai`）；
    - `/free/new` 可以指定发牌人（`poolDealIndex`，私人牌桌也用）；
    - 一轮的进度只存在页面里，换语言时以 `&round=…` 带过去；
    - 改正了牌池的说法：存的是每个座位的叫牌计划，不是只有两台电脑的。
  - `operations.md`：自由对局的复盘也包括 AI 自己打的那一局，当场算、不保存。
  - `ui.md`：
    - `ScoreSheet`、`VsAiTable` 补上在自由对局里的用法；
    - 新增「At the table」一段：报价时「Höher …」展开的叫牌值、自由对局的进度药丸、一轮结束时的「Deine Runde」面板。
- **复查**：验收标准没有受影响，没有重跑。按 cap4，在最终分支上跑了一次机械防线。

## 净效果

产品行为和交付时一样；charter 和代码对上了。SKATGO-86 handoff 里报告的那份过时说明，这次也一起解决了。
