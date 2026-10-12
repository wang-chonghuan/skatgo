# SKATGO-88 acceptance checks

在构建产物上跑（web 55088、multiplayer 56088、数据库 57088），Playwright 有头浏览器，桌面 1280×820，手机 375×812。牌局由脚本走合法着法推进：浏览器只打每副的最后一张牌，前面的着法通过 API 在同一个 token 上完成。

## AC1 发牌人轮换
- 一轮 6 副里，第 n+1 副的发牌人是第 n 副发牌人的下一家，玩家的位置 V、M、H 各出现两次。从页面发出的 `/api/free/new` 请求（带 `dealer`）和返回的牌桌状态都能看到。
- 服务器：`/free/new` 带上 `dealer` 时，返回的这一局发牌人就是它。

## AC2 进度和一轮的结束
- 每副牌桌上的药丸是「Spiel n von 6 · gesamt X」，X 等于此前各副玩家 Seeger-Fabian 分的和。
- 第 1–5 副结束时按钮是「Nächstes Spiel」，第 6 副是「Zur Auswertung」；之后显示 6 行对比和整轮计分表，以及「Neue Runde」按钮；点它开始新的一轮，药丸回到「Spiel 1 von 6」。
- 第 11 课：一局结束时仍然是原来的样子，没有药丸，也没有「Zur Auswertung」。

## AC3 换语言
- 一轮进行到第 3 副时换成英文：牌局和进度（第 3 副、累计分）都还在。
