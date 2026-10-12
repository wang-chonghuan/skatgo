# SKATGO-96 acceptance checks

构建产物 web 55096、multiplayer 56096、数据库 57096，Playwright 有头浏览器，桌面 1280×820、手机 375×812。牌局只用脚本的合法着法推进（通过页面点第一张合法牌、叫牌都 Passe）。

## AC1 刷新、重开后接着打
- 自由对局打完第 1 副、进入第 2 副并出过至少一墩后刷新：仍是 „Spiel 2 von 6“，手牌、桌上的牌、已出的墩数和本轮总分与刷新前相同。
- 关掉这个页面（关闭浏览器上下文中的页），在同一浏览器里重新打开自由对局：同上。

## AC2 Neue Runde 和离开
- 点右上角按钮 → 「Neue Runde」→ 确认：牌桌显示 „Spiel 1 von 6“，总分 0。按钮 → 「Neue Runde」→ 取消：仍是原来那一副。
- 按钮 → 「Tisch verlassen」：回到首页；再进自由对局，回到离开前那一副。
- 按钮 → 「Weiterspielen」：菜单关闭，牌桌不变。

## AC3 所有牌桌都能看到退出按钮
- 桌面和手机，自由对局、每日赛、好友牌桌：不拉开抽屉就能看到右上角按钮；每日赛和好友牌桌的菜单里没有「Neue Runde」；侧栏里没有「Tisch verlassen」。
- 每日赛的「Tisch verlassen」去 `/de/taeglich`，好友牌桌的去 `/de/mit-freunden`。

## AC4 隐私说明
- `/de/datenschutz`、`/en/privacy` 不再说刷新开始新的一局，而是说自由对局的令牌存在本浏览器。
