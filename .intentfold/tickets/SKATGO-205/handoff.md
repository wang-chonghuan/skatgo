# SKATGO-205 handoff

## What changed

**规则（前后端共用，`app/src/lib/skat/league.ts`）**
- 每副联赛分 `DEAL_POINTS`：己方赢 +3（自己当庄赢，或防守打掉庄家）、自己当庄输 −3、防守输了（庄家赢）−1、全 pass 0；`dealOutcome(declarer, won, seat)` 判定是哪一种。
- `PROMOTE_AT = 30`、`RELEGATE_AT = −20`，`standingAfter` 换档后归 0；青铜最低停在 −20、不降；传奇不升、−20 降回钻石。
- 每副费用 `FEES = [3, 4, 5, 7, 8, 10]`。删去 `ROUND_DEALS`、`PLACE_POINTS`、`placesOf`。`LeagueResult` 改为“上一副每个座位的结果”（outcome、points、standing、moved、canPay）。单元测试按工单重写。

**multiplayer**
- `src/model.ts`：联赛房间是一次“入座”（sitting），没有一轮的结束；`nextDue` 在每个在线的人都点了下一副时到期，没人在线时等离开的人的 30 秒宽限过完后到期。联赛的 `leave`：连接立即断开（`left`），座位像断线一样等 30 秒宽限，之后电脑把这副打完，照常计分；下一副由拟人玩家接替。宽限内回来仍坐原位。
- `src/league.ts`：`settleLeague` 每副结束时在同一事务里给每个真人计分、改档位分数、写 `league_deals.points`，并记下他能否付下一副（`canPay`）；`leagueDeal` 发下一副：离开的、不在的、换了档的、金币不够的座位换成该档拟人玩家（不重复同桌的人），留下的人各扣本档费用；没人留下时结束这次入座（`finished_at`，房间 10 分钟后过期）。拟人强度 `TIER_ERRORS` 未变，注释里的校准数据换成本单的。
- `src/room.ts`：命令和定时节拍里到期就调用 `leagueDeal`，被换下的连接收到 `left`。
- `src/store.ts`：`league_deals.points`、`league_players.scale`；第一次启动时把旧尺度（scale 1）的联赛分归 0（档位、金币保留），只执行一次。
- `test/league.test.ts`：按本单重写（见 AC 结果）。

**web**
- `game-table.tsx`：联赛牌桌板上只写 “Deal n”（没有 “of 3”），板上的 TOTALS 只显示当前这副的分（像每日一副），不跨副累计；结果弹窗第一行是联赛分那一行（`RoomTable.league.line`），之后是 XP 与 AI 对比；菜单里 “Leave the table” 发送 `leave` 并回联赛页。
- `league.tsx`：`DealLine`：联赛分做成与 XP 同样的胶囊（赢绿、输红、0 灰），旁边写原因（“League points +3” + “You beat the declarer”，升降时加 “Up to the Gold League!”，付不起下一副时加 “Not enough coins – you get 100 more tomorrow.”，此时底部按钮是 “Back to the League”）；去掉本轮结果和 “Play again”。联赛卡的进度条从 −20 到 +30；按钮 “Play · 3 coins a deal”。
- `league-tiers.tsx`：每档卡片 “3 coins a deal”。
- 文案 en/de：开局按钮、费用、“How the League works” 三段、五种原因；页面描述和两条错误提示里的 “round / Runde” 改为牌桌；删去用不到的 `league_round_result`、`league_place_*`、`league_again`、`league_fee`。

**charter 与文档**：product.md、ui.md、engineering.md 的联赛段落改为每副结算（工单授权）；`multiplayer/README.md` 联赛一节；`.agents/skills/skatgo-personas/references/rooms.md` 一句。没有新依赖、没有新 token、没有新表（两列加在已有表上）。

**校准**：`calibrate.mts` / `calibration.txt`（每档 1200 副，每 100 副的联赛分）：SkatZero 坐这个座位 青铜 +131 → 传奇 +50；中位拟人玩家 +73 → −44；偏弱（p20）+53 → −41。强者一路能升，一般水平停在中间几档。

## AC results

1. 通过。单元测试覆盖 +3/+3/−3/−1/0。服务测试：连打 4 副，每副在 `league_deals.points` 里记一次，档位分数等于各副之和。浏览器（两次，各一副）：结果弹窗第一行是联赛分胶囊和原因（“League points −1” · The declarer made it；最终构建上那副是 “League points 0” · All passed），在 XP 行之前，之后有 “If the AI had played your cards”；库里记的分和页面一致。
2. 通过（单元测试）：+30 升、−20 降、换档归 0；青铜停在 −20 不降；传奇不升、−20 降。
3. 通过。服务测试：每副发牌时扣 3（140 → 128，打了 4 副）；共享牌桌上金币不够的人在下一副被拟人玩家换下、不扣费，另一人照常付费。浏览器：金币 2 时结果弹窗写明金币不够、明天补，底部是 “Back to the League”，点了回联赛页、入座结束、金币仍是 2；开局按钮置灰，`/api/league/play` 409，自由对局和每日一副 200。
4. 通过。一人时 5.1 秒进牌桌（含页面跳转），另两座是拟人玩家，板上 “Deal 1”；服务测试：一直发到第 4 副，没有一轮的结束，发牌人轮转；第 4 副中途离开：连接立即断开，座位等满 30 秒宽限后电脑打完，这副照常计分，不再扣费，没人留下，入座结束；共享牌桌上断线的人 30 秒后由 AI 代打，回来仍坐原位、金币不变。
5. 通过。联赛页：档位、联赛分、距升级、金币；开局按钮 “Play · 3 coins a deal”；“How the League works” 是每副计分的说明；六档 3/4/5/7/8/10 “coins a deal”；传奇榜按分排序、标出自己、没有拟人玩家。
6. 通过（服务测试）：旧尺度的一行启动后分数为 0、档位和金币不变；再启动一次不再改动。
7. 通过：`/en/league`、`/de/liga` 的 League/Liga、Bronze…Legend / Bronze…Legende；375px 无横向滚动。

机械防线（`engineering.md` Tools）：typecheck、build、351 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`（52 个可索引页，按检查器约定停掉本地 multiplayer，论坛未检）与 `test:seo` 全部通过；文案修改后重跑一遍，同样全过。`npm --prefix multiplayer run check`：70 个测试中 69 个在最终服务代码上通过；League 测试在“离开等 30 秒宽限”之后失败——测试里那张两人桌的两人一直没连上，宽限期间电脑打完了第一副，下一副按规则把不在的两人换成了拟人玩家（产品行为正确，测试的时序假设错了）。改成两人桌一成形就入座后单独重跑，通过（77 秒）。

## Deviations

- plan 里的 `dealPoints` 实际拆成 `DEAL_POINTS` 表加 `dealOutcome`（结果页的原因文字要用到是哪一种）。
- 离开：第一版是点离开后电脑立即接手；交付前按工单 “离开或断线时，当前这副 30 秒后由 AI 代打完” 改为等 30 秒宽限（宽限内回来仍坐原位）。
- 旁观评审（只看截图和你的原话）后的修改：结果页的联赛分原是普通正文、比下面绿色的 XP 胶囊还不显眼，按“打一个 deal 就有获得感”改成同样的胶囊；牌桌板上的 TOTALS 原来跨副累计（一轮排名的残留），改为只显示当前这副；文案和注释里残留的 “round / Runde” 改掉。评审另提的两点是截图问题，不是产品问题：传奇账号的档位卡片截在了滚动途中；测试账号截图右上角显示 “Sign in”（测试账号不经过 Clerk，你用 Gmail 登录看到的是正常的已登录页头）。

## Environment

- 端口：web 55205，multiplayer 56205，database 57205（工单本地库；`multiplayer/.env` 的 `DATABASE_URL`、`app/.env` 的 `MULTIPLAYER_URL` 指向工单端口，不同步回主目录）。
- 没有新增、修改或删除环境变量键。
- 工单库里用 `demo-me.sh` 拷贝了你在生产上的记录（只读生产），用 Gmail 登录本地预览可看到自己的数据；联赛从 Bronze 0 分、当天 100 金币开始。

## Residual

- 联赛的牌仍不能从“历史与分析”里重打（SKATGO-204 已记）。
- 生产上线时，正在进行的联赛牌桌从下一副起按新规则继续；它们当前这副按旧代码结束时不会写本单的每副分数（旧代码在第 3 副才结算），影响最多一副。

## Check

1. http://localhost:55205/en/league — 用 Gmail 登录，点 Play 打一副：结果页第一行的联赛分胶囊（赢绿、输红、0 灰）和原因文字是否是你要的“获得感”；牌桌板上 TOTALS 现在只显示这一副的分。截图 `tmp/league-deal-result-PC.png`（0 分、金币不够的情形）。
2. 同一页 — 联赛卡：“Play · 3 coins a deal”、进度条从 −20 到 +30、“30 to promotion”；档位卡片 “N coins a deal”。
3. 同一页右上角的问号 — “How the League works” 三段新说明的措辞。截图 `tmp/league-how-PC.png`、`tmp/league-how-phone.png`。
4. 牌桌右上角的退出按钮 → “Leave the table”：回联赛页；这副由电脑在 30 秒后打完、照常计分（之后在联赛页能看到分数变化）。

## Decided for you

- 下一副到来时不在线的人和离开的人一样被换下（拟人玩家接替、不扣费）；回来要重新开局。
- 没人留在桌上时：等离开/断线的人 30 秒宽限过完，入座结束。
- 牌桌菜单 “Leave the table”：发送离开并回联赛页；这副由电脑在 30 秒后打完，照常计分；共享牌桌上这 30 秒里轮到他时，其他人要等。
- 结果页联赛分用与 XP 相同的胶囊（赢绿、输红、0 灰）；牌桌板上的 TOTALS 只显示当前这副。
- 不能中途加入正在进行的牌桌（工单不含）。
- 每副的原因文字：“You won your game” / “You beat the declarer” / “You lost your game” / “The declarer made it” / “All passed”，升降时接 “Up to the … League!” / “Down to the … League.”。
- 旧联赛分归 0 只执行一次（按 `scale` 列），重启不会再清。
- 联赛卡的进度条从 −20 到 +30。
- 上线时正在打的牌桌从下一副起按新规则继续。
