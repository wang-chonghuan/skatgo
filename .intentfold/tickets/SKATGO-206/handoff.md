# SKATGO-206 handoff

## What changed

**数据（前后端共用类型 `app/src/lib/skat/league.ts`，服务 `multiplayer/src/league.ts`）**
- `LegendBoard` 改为 `LeagueBoard`：`{ rows, me? }`，每行 `{ rank, nickname, tier, points, you? }`；`BOARD_SIZE = 100`。
- `leagueBoard`（取代 `legendBoard`）：在联赛牌桌上坐过、且那张桌至少打完一副的账号（`league_matches.seats` + `league_deals`，含 SKATGO-204 按轮打的副），按档次降序、再按档内联赛分降序；同档同分同名次（`rank()`）。只列有名字的账号（注销的账号 SKATGO-185 删了名字，不上榜）。返回前 100 名；提问者排在 100 名以后时，单独作为 `me` 返回。`/league/state` 对游客和账号都返回这张榜。
- `app/src/lib/league-api.ts`、`league-handler.ts`：类型和注释跟着改名。

**网页（`app/src/components/skat/league.tsx`）**
- 联赛页底部的榜单改为总榜：每行最左是总排名（宽度够放三位数，`space.x32`，等宽数字），然后是该档徽记（`dims.badge` 24px，`radii.tag`，alt 为档位名），然后是名字（自己那行加 "You"、`goodSoft` 底），最右是联赛分。行改为垂直居中对齐。自己排在 100 名以后时，榜底先一行 "…"，再是自己那行。没人打过时榜单不显示。
- 标题 `league_board`："League ranking" / "Liga-Rangliste"（原 "Legend board" / "Rangliste der Legenden"）。
- 徽记 `app/public/league/badge/<tier>.webp`（6 张，96×96，WebP q90）：从各档卡片图里把右上角的徽记连同闪光裁成正方形，底色就是该档的颜色，画风不变。做法：`dwebp` 解出像素，取与左下角底色差异大于 60 的像素的外接框，放大 12% 取正方形，再 `cwebp -q 90 -crop <x> <y> <s> <s> -resize 96 96`。各档裁切（x y 边长）：bronze 242 5 222、silver 252 20 219、gold 242 8 220、platinum 248 12 210、diamond 237 14 220、legend 188 0 278。

**charter 与文档**：product.md（联赛段：传奇不升档，分数继续累计；联赛页底部是总榜，规则写明）、ui.md（联赛页的榜单：行的组成、徽记、前 100 名和 "…"）——工单授权；`multiplayer/README.md` 的 `state`。没有新依赖，没有新 token。

**测试**：`multiplayer/test/league.test.ts` 在原有对局之后检查总榜：坐过桌的 a、c、d 都在榜上，档位和分数与库里一致、顺序正确、同分同名次；从没坐过的 `user:poor`、`user:e` 不在榜上；提问者那行有 `you`；游客拿到同一张榜、没有 `you`；再放 101 个传奇档账号，榜上只有前 100 名，提问者作为 `me` 排在 101 名以后。

## AC results

本地：web 55206（生产构建）、multiplayer 56206、database 57206；Playwright 有头浏览器，1280×820 和 375×812，英文和德文。没有在浏览器里打牌：浏览器检查用的榜单数据直接写进工单本地库（打完一副的桌、没打完的桌、只有联赛行没坐过桌的账号、各档位、并列、长名字）。服务测试自己开库真打。

1. 通过。服务测试：坐过桌的账号都在榜上，从没坐过的不在。浏览器：榜上正好是 9 个打完过一副的账号；坐了桌但一副没打完的、只有联赛行的都不在。
2. 通过。顺序 传奇 40、传奇 40、钻石 10、铂金 15、黄金 25、黄金 −5、白银 0、青铜 12、青铜 −20，名次 1,1,3,4,5,6,7,8,9。每行依次是名次、徽记（加载成功、alt 为档位名，六档都出现）、名字、分数（贴右边）。排到 100 名以后，徽记和名字的左边缘仍在同一列（全部 304px）。
3. 通过。登录后自己那行标 "You"；改成 27 分后名次 8、青铜徽记；升到黄金 0 分后名次 6、黄金徽记，仍标为自己。放 101 个传奇账号后：101 行（前 100 + 自己），一行 "…"，自己名次 107。服务测试同样检查了 `you` 和 `me`。
4. 通过。未登录游客看到同一张 9 行的榜，没有哪行标为自己。
5. 通过。英文、德文页面各只有一张榜，标题 "League ranking" / "Liga-Rangliste"，页面上没有 "Legend board" / "Rangliste der Legenden"。
6. 通过。英文和德文、375 与 1280：每行名次、徽记、名字、分数都在一行、都在卡片内；手机上长名字截成 "…"；页面无横向滚动。

**机械防线**（`engineering.md` Tools，在 20d65e8 上）：typecheck、build、351 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`（52 个可索引页，论坛未检）与 `test:seo`（28 个）全部通过。
**multiplayer 全套**（`npm --prefix multiplayer run check`）：typecheck、build 通过，70 个测试中 62 个通过；失败的 8 个全在 `personas-strength.test.ts`，都是 `store.acquire()` 拿不到 leader 锁——当时工单自己的 multiplayer 服务（56206）开着，和测试用同一个库，锁在它手里。停掉服务后单独重跑这个文件，8/8 通过。联赛测试在改动后单独跑过，通过（79 秒）。

**照人的眼光看一遍**：独立的子代理对照你的原话和以前的选择看了截图，认为位置、徽记、分数、排名、排序、取代传奇榜都符合。它指出两点，都已处理：排到三位数时名次列变宽，徽记和名字往右偏了约 3px（已把名次列加宽到能放三位数并用等宽数字）；测试数据里没有铂金档，第六种徽记看不到（已加一个铂金档玩家）。

## Deviations

- 计划之外：名次列从 `space.x24` 加宽到 `space.x32`，并加 `flexShrink: 0` 和等宽数字（上面的复核发现的问题）。
- 其余按 plan.md；方案建议（Proposed solution）里的做法都照用了：上榜条件、并列规则、裁徽记、前 100 名加自己那行、现有传奇榜组件和接口直接改成总榜。

## Environment

- 端口：web 55206、multiplayer 56206、database 57206（Colima `skatgo` profile，容器 `skatgo-multiplayer-db-57206`）。
- env 键：没有新增、修改或删除。worktree 里 `multiplayer/.env` 的 `DATABASE_URL` 端口改成了 57206，只是本工单本地用，不同步回主目录。
- 工单本地库里有供你审查用的数据：验收写入的 9 个测试玩家（名字是编的），以及用 `demo-me.sh` 只读复制的你的记录；另外把你生产账号的联赛状态（青铜、11 分、154 金币、名字 Wyong、打过一副）加到你的 Gmail 开发账号上。

## Residual

- 注销账号（SKATGO-185 的 `forgetPlayer`）不删 `league_players` 这一行（联赛是后来加的）。榜单按名字过滤，所以注销的账号不会出现在榜上，但档位、分数、金币的记录还留在库里。值得单开一个工单把联赛数据也纳入注销。

## Check

1. http://localhost:55206/en/league — 用 Gmail 登录，滚到页面最下面的 "League ranking"：你那行（Wyong）标 "You"；每行左边是名次，名字左边是档位徽记，右边是分数；先按档次再按分数排（所以分数一列看起来不是从大到小，这是规则本身）。其他名字是测试数据。
2. 同一页缩到手机宽度 — 徽记在 24px 下是否认得出；长名字截成 "…"、分数仍在右边。

## Decided for you

- 上榜条件：坐过一张至少打完一副的联赛桌的账号，含 SKATGO-204 按轮打的副。
- 注销的账号不上榜（名字已删）。
- 同档同分名次相同，后面的名次跳过（和原来的传奇榜、XP 榜一样）；同名次内的先后没有意义。
- 徽记放在名次和名字之间。
- 标题 "League ranking" / "Liga-Rangliste"。
- 没人打过时不显示榜单。
- 徽记 24px（现有 `dims.badge`）、圆角用 `radii.tag`；名次列加宽到 `space.x32`。都用现有 token，没有新 token。
- 每次打开联赛页时现算榜单，不加新表、新列。
