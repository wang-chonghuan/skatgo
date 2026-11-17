# SKATGO-204 handoff

## What changed

**multiplayer**
- `src/league.ts`（新）：`/league/*` 路由（state、checkin、play、review），在 admission key 之后。签到按柏林日（`dayOf`）每天一次 100 金币；`play` 在 leader 内存里按档等同档真人最多 5 秒，满 3 人立即开，否则用该档的拟人玩家补座，同一事务里扣入场费、存房间和 `league_matches`；`settleLeague` 在第 3 副结束的那次变更里按 Seeger-Fabian 总分排名次、改每个真人的档位和联赛分，只算一次；`review` 把请求者的座位转成 0 号座（同一副牌、发牌人随之转），复用自由对局的复盘，并把这副牌记入 `play_deals`（键 `league:<pool>:<deal>:<seat>:<round>:<n>`），因此照常计 XP、进入历史。
- 拟人玩家：`population(500)` 按自己的出牌失误率（看板用的 `/2` 强度策略）由弱到强分成六段，每档取对应一段；出牌用其本人的强度策略，失误率按档保留 1 / 0.8 / 0.6 / 0.4 / 0.2 / 0（传奇档出牌即 SkatZero），叫牌用牌池里 SkatZero 的计划。同一拟人玩家不会同时坐两桌，也不在看板活动前后 30 分钟入座，不用真人已占的名字。
- `src/model.ts`、`src/room.ts`：`Snapshot.league`；联赛房间不能按房号进入、没有房主和离开；拟人座位以玩家身份公开（不显示 AI）、不参与“下一副”的等待；无人在线时电脑继续打、自动发下一副，所以一轮总会结束；记录每副牌的每一步；结束后房间不再占用“一人一个房间”，10 分钟后过期。`src/store.ts` 三张新表 `league_players`、`league_matches`、`league_deals`（同库，非新资源）；`store.insert` 供同一事务建房。`src/referral.ts`：联赛房间不出现在私人牌桌的“回到房间”，也不能按房号进入。`src/free.ts` `poolDealOf`（房间与联赛共用）。
- `test/league.test.ts`（新，真服务、独立数据库）；`README.md` 联赛一节。

**web（app/）**
- `lib/skat/league.ts`（新）：档位、入场费、名次、升降规则，前后端共用；`league.test.ts`。
- `lib/league-handler.ts`（新）`/api/league/*`：注明账号、转发、签发联赛房间的 join ticket；`lib/league-api.ts` 浏览器调用；`lib/checkin.ts` 每次加载页面由框架签到一次（联赛页面等签到完成再读金币）。
- 页面：`/league`（德 `/de/liga`）`league-page.tsx`、`league.tsx`、`league-tiers.tsx`；`/league/play`（德 `/de/liga/spielen`）全屏牌桌。两页 noindex，加入 sitemap 的页面清单（被 indexability 排除）。
- `table-room.tsx`：私人牌桌的连接逻辑抽成 `useSeat`，联赛牌桌复用；`game-table.tsx`：`RoomTable.league`（“第 n 副，共 3 副”、每副结果带 XP 和 AI 对比、第 3 副底部“本轮结果”、菜单是退出回联赛页）。
- 首页 `entry-page.tsx`：联赛占原“叫牌练习”彩色卡（`tileNavy`、lucide `Trophy`、♣A ♣10 ♣K）；叫牌练习成为第四张图片卡（`public/bidding-card.webp`，Azure gpt-image-2 按 practice-card 画风生成，过程见 `bidding-card.md`），与 Practice 并排在第三列。
- 文案 en/de。

**charter 与项目 skill**：product.md（联赛一段；SKATGO-180 那句改为拟人玩家也坐联赛空座）、ui.md（首页卡片、联赛页面与牌桌）、engineering.md（联赛模块与表；“No arena or public matchmaking” 一句与人的请求矛盾，同步修改）；`.agents/skills/skatgo-personas` 允许联赛空座。没有改 token 注册表，没有新依赖。

## AC results

1. 通过：访客打开 `/en/league`（PC、手机）看到六档 Legend 30 … Bronze 10 和登录按钮，没有开局按钮；`/api/league/play`、`/api/league/checkin` 均 401。
2. 通过：新账号打开首页后 100 枚，再打开仍 100；把库里改成“前天签到、剩 40”后打开为 140。服务层测试另证同一天第二次签到 `added: 0`。
3. 通过：新账号页面显示 Bronze、0 分，自己那档标出；点开局后 90 枚；金币改为 5 时按钮置灰并显示“明天补 100”，`/api/league/play` 409 `not_enough_coins`，`/api/free/new`、`/api/daily/state` 200。
4. 通过：一人时 5.1–5.3 秒进入牌桌（含页面跳转），另两座是拟人玩家（快照里 `persona` 为 `sim:` 而非账号）；服务测试：两个账号 1.5 秒内先后开局，同一房间。
5. 通过：一轮三副，发牌人 2、0、1 各不相同；第 3 副结果页有 XP 行和“If the AI had played your cards”，`play_deals` 有该副记录（键 `league:…`，复盘重复请求不重复计）。
6. 通过：单元测试覆盖 +3/+1/−2、同分取较好名次、+12 升、−8 降、换档归零、青铜不降、传奇不升；浏览器里本轮结果显示名次与得分，库里档位分数一致；服务测试证实只结算一次。
7. 通过（服务测试，真 30 秒宽限）：断线后该座由 AI 代打，重新连入回到原座位，金币不变。
8. 通过：`/en/league`、`/de/liga` 显示 League / Liga 与 Bronze…Legend / Bronze…Legende；375px 下联赛页和首页无横向滚动。
9. 通过：首页彩色卡依次为 daily、play、course、league，联赛卡进 `/en/league`；图片卡依次为 friends、forum、tricks、bidding，叫牌练习卡进 `/en/bidding-practice`，其他链接不变；PC 与手机。
10. 通过：两个传奇账号按分数排序，自己一行标出；`league_players` 没有 `sim:` 行。

机械防线：typecheck、build、351 个测试、client bundle、design tokens、literal grep、SSR link 全过；check:seo --built 与 test:seo 通过（52 个可索引页）。check:seo 第一次在 /en/forum 失败，原因是工单本地库没有论坛帖子；按检查器的约定停掉本地 multiplayer 后它跳过论坛（“forum not checked”），其余全部通过。`npm --prefix multiplayer run check` 70/70 通过（132 秒）。它前两次失败：新的 league.test 与 rooms.test 并行时用了同一个 TEST_PORT（已改为相隔 5 个端口，单独提交），且本地预览服务占着工单库的 leader 锁（persona 测试要拿这把锁）；停掉预览后重跑全过。rooms.test 单独跑 103 秒全过。

## Deviations

- 拟人玩家强度：plan 原定按旧的 `mistake` 分段、用旧策略出牌。校准（`calibrate.mts`，`calibration.txt`，每档 400 轮）显示这样青铜几乎和传奇一样强（SkatZero 在青铜每轮 +1.54、传奇 +0.86），与工单“低档较弱、约 11–21 轮升一档”的假设不符；改为看板现用的 `/2` 强度策略、按档缩放失误：SkatZero 青铜 +1.90 → 传奇 +0.97（名次 37/38/26%，接近持平），中位拟人玩家青铜 +1.06 → 传奇 −0.51。
- 旁观评审后的修改：本轮结果把“+1 联赛分”和“现在 +1”合成一行；联赛页去掉“青铜不降级”“最高档”这类句子、传奇榜空时不显示、等待时文字放在按钮上、访客一句话；叫牌练习图片卡标题用原彩色卡的一行 “Bidding / Reizen”。

## Environment

- 端口：web 55204，multiplayer 56204，database 57204（本工单本地库，`multiplayer/.env` 的 `DATABASE_URL` 指向 57204；`app/.env` 的 `MULTIPLAYER_URL` 指向 56204）。这两处是工单端口，不同步回主目录。
- 没有新增、修改或删除环境变量键。
- 工单库里用 `demo-me.sh` 只读拷贝了你在生产上的对局记录，你用 Gmail 登录本地预览即可看到自己的历史与 XP；联赛数据是新的，从 0 开始。

## Residual

- 联赛的牌不能从“历史与分析”里重打（转座位的重打要让自由对局的 token 和胜率道具也支持转座位）。
- 首页 PC 上第三列的两张图片卡比前两张窄 12px（第三列 `2fr` 不含两张卡之间的间距），图片因此矮 7px；要四张等宽需要新的网格 token。

## Check

1. http://localhost:55204/en — 联赛彩色卡：现在是原来的藏青色加奖杯图标；另两种颜色（紫、金）只做了截图 `tmp/tile-purple-PC.png`、`tmp/tile-gold-PC.png` 供选择，选它们需要新增颜色 token。
2. http://localhost:55204/en — 第四张图片卡“Bidding”的新配图，以及第三列两张卡比前两张略窄（见 Residual）。
3. http://localhost:55204/en/league — 用 Gmail 登录后看自己的联赛卡（档位、联赛分、距升降、金币、“+100 today”、开局按钮）、六档列表。
4. http://localhost:55204/en/league — 点 Play：按钮变成 “Finding players …” 约 5 秒后进牌桌；对手的名字、每副的结果页（与自由对局相同：XP 和“如果 AI 打你的牌”——工单要求保留，旁观评审认为你可能会想在联赛里去掉）。
5. 打完第 3 副后的 “Round result”：名次、三人总分、一行得分与升降，“Play again · N coins” 与 “Back to the League”。

## Decided for you

- 拟人玩家补座与看板运行开关无关（开关管的是批量看板模拟）；上线本身仍是你单独决定。
- 各档对手强度：拟人玩家按自身出牌失误分六段，失误按档保留 1、0.8、0.6、0.4、0.2、0；叫牌都用 SkatZero 的计划（数据见 Deviations）。
- 拟人玩家在联赛里不得 XP、不进历史、没有段位。
- 签到：登录后每次打开网站时请求一次，同一柏林日只给一次；新账号从 0 开始、第一次打开得 100。
- 页面上的“今日金币”显示为余额，签到过后加 “+100 today”。
- 每副牌的 XP：玩家自己打开那副结果时记入（与自由对局相同）；断线期间 AI 打完的牌，回来打开结果才算。
- 青铜的联赛分最低停在 −8。
- 中途离开：菜单里“离开牌桌”回联赛页，座位仍是自己的，30 秒后 AI 代打，联赛页显示“回到你的牌桌”；不退入场费。
- 第 3 副结束即结算（不等点按钮），只算一次。
- 传奇榜：分数相同按先达到者在前；只列真人账号；空时不显示。
- 地址 `/en/league`、`/de/liga`，牌桌 `/en/league/play`、`/de/liga/spielen`，都不收录。
- 联赛的牌在历史里列出但不能重打（见 Residual）。
