# SKATGO-86 grill

人 2026-10-12 说：「开发吧，同一个牌桌，不用再grill了」。所以这次不问人，由 agent 依据 charter 和读到的代码自行裁定，裁定和依据如下。

1. **第 11 课要不要一起做？** — 要。人说「同一个牌桌」：第 11 课和自由对局共用一张牌桌，结束后显示同样的结果，即分数表和 Spielverlauf。
2. **玩家自己的分数怎么显示？** — 用 Seeger-Fabian，三个座位都显示，跟每日赛的 `ScoreSheet` 一样（工单约束：「用 Seeger-Fabian」）。原来胜负面板里的游戏分那一行去掉；Spielverlauf 下面的算分公式保留。
3. **三家都 pass 的局** — 也显示分数表：玩家那一行是 0 0 0「Eingepasst」，AI 那一行是它坐这个位置时的结果。服务器接受 `passedIn` 状态的复盘。依据：工单验收标准 1「或者写明三家都 pass」。
4. **一个请求还是两个** — 并进现有的 `/free/review`。分数表和 Spielverlauf 共用一次请求，限流计数不变。
5. **charter** — product.md 和 ui.md 里自由对局结果的描述会过时。charter 由人负责，这次没有得到修改授权，所以不改，在 handoff 里报告。
