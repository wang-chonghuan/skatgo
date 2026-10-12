# SKATGO-98 handoff

## 改了什么
- 规则（ISkO 3.4.2–3.4.4）：只有能达到叫价的定约才能宣布，按打出 Schneider 和 Schwarz 后的最高价值算，Hand 局算上已宣布的等级。花色和 Grand 都够不到时，允许宣布一个并按叫过头判输。价值低于叫价的 Null 不能宣布，结算也判输（原来一墩不拿就算赢）。
- 服务器：新的人类宣布不合规就拒绝（`illegal_action`）。已记录的牌局照原样重放。SkatZero 的宣布不合规时，改用规则内最好的一个。
- 定约弹窗：不允许的定约格子禁用。选中一个定约时只有一句说明：够、只有打出 Schneider 才够、只有打出 Schwarz 才够、全都不够（叫过头）、这个不够。删掉了原来那句不准确的说明。
- 「Was spielen?」提示只推荐允许的定约。

## 验证
- 完整机械检查全过：typecheck、build、单元测试 124/124、client bundle、设计令牌、git grep、SSR、SEO（46 页）、SEO 测试 25/25、multiplayer check 21/21。
- `tmp/api.mts` 4 项、`tmp/ui.mjs` 6 项全过（见 ac.md）。

## 未做
- 查生产库历史成绩：人说不用。
- 每日赛的启发式电脑在每次重放时重新计算，所以它的宣布规则不变，否则会改动旧局的结果。
