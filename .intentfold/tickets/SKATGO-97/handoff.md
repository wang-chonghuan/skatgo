# SKATGO-97 handoff

## 改了什么
- 定约弹窗删掉顶部说明句（`declare_prompt`，德英）。
- 信息板：格子里数字到下面一行的间距 4px → 2px，标签到数字仍 4px。「Spiel n von 6」现在与「Lina / Du / Noah」在同一水平线。「Reizen」「Reizwert n」两行也随之上移 2px。

## 验证
- 机械检查全过：typecheck、build、单元测试 118/118、client bundle、设计令牌、git grep、SSR、SEO（46 页）、SEO 测试 25/25。
- 浏览器 `tmp/ac.mjs` 4 项全过：
  - 桌面上「Spiel 1 von 6」和三个名字都在 58.4px，手机上都在 129.4px；改动前线上是 60.4 对 58.4，名字的位置没变。
  - 脚本只跟叫，赢下叫牌后打 Hand，定约弹窗里已没有那句。

## 追加：「Ändern」改绿
- `daily-table.tsx`：每日赛结果处名字旁的「Ändern」从 `quiet` 改为 `go`（绿色）。
- 验证：`tmp/finish.mts` 用脚本合法着法让新设备打完今天的 6 副赛，`tmp/nick.mjs` 在桌面和手机上量到按钮背景 rgb(0, 163, 54)，2 项全过；typecheck、build、设计令牌检查通过。
- 待人决定：charter ui.md 第 245 行写的是 `quiet` "Ändern"。

## 追加 2
- 名字那一行（`Nickname`）移到排行榜面板第一行（`daily-table.tsx` `Leaderboard` 的 `name`），结果面板只留成绩。
- `ui.tsx` `landingTones.go` 不再换成公开站点的绿色：首页和每日赛页的「Heute spielen」都是标准绿色 #00A336（形状和字体不变）。
- 验证：build、单元测试、设计令牌、client bundle 通过；`tmp/more.mjs` 4 项、`tmp/nick.mjs` 2 项全过，桌面和手机都测了。
- 待人决定：charter ui.md 第 85 行（`goLanding` 是公开站点按钮的绿色）、第 244–245 行（名字一行在结果里、`quiet` "Ändern"）已和代码不符；`color.goLanding`、`elev.btnGoLanding` 已无人使用。

## 服务
web http://127.0.0.1:55097、multiplayer 56097、数据库 57097 在跑。
