# SKATGO-98 acceptance checks

- 单元测试（`skat.test.ts`）：价值低于叫价的 Null 结算为输；只有打出 Schneider 才够的定约可宣布；有别的够时不够的不可；Null 低于叫价不可、Null ouvert 46 可；全都不够时花色和 Grand 可、Null 不可；Hand 局算宣布。
- API（`tmp/api.mts`，web 55098，脚本合法着法）：叫到 24 后宣布普通 Null 被拒（`illegal_action`），Null ouvert 通过；30 局中玩家全部 Passe，都能打完，其中 27 局由电脑当庄家宣布。
- 浏览器（`tmp/ui.mjs`，桌面和手机）：赢下叫价 48 的叫牌后，够不到的定约格子禁用、点了不选中、按钮不可用；够的定约可以宣布。
