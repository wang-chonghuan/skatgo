# SKATGO-90 handoff

## What changed

- **随机名**（`app/src/lib/skat/nickname.ts`）：
  - 加了人同意的词表：35 个形容词（词尾随名词的性变化）和 50 个名词。
  - `RANDOM_NAMES`：可用的组合 1745 个，有 5 个超过 20 个字符被去掉。
  - `pickName(seed, taken)`：从玩家标识的哈希起，用和总数互质的步长依次试，取第一个没被占用的名字；全部被占用时才加两位数。
  - 新测试 `nickname.test.ts`：名字都合规、互不相同、形容词和名词的性一致；同一个玩家永远得到同一个名字；只有全被占用时才出现数字。
- **multiplayer**：
  - 新表 `daily_players(player, nickname, created_at)` 存「当前名字」。迁移时把每个老玩家最后设的昵称写进去（可以重复执行，`ON CONFLICT DO NOTHING`）。
  - 记录打完时，`nameFinished` 把当前名字写进这条记录的 `nickname`，只写原来是 NULL 的。
  - 第一次需要名字时，`nameOf` 持 advisory lock 分配一个，避开所有当前名字和记录里已有的名字（不分大小写）。
  - leader 启动时，`nameUnnamed` 给以前打完、名字还是 NULL 的记录补上名字。
  - `dailyName`：
    - 改当前名字，以及今天已打完的记录，过去的不动；
    - 名字不合规返回 `nickname_refused`，和其他玩家的当前名字重了返回 `nickname_taken`，从没打完过返回 `not_finished`；
    - 页面发来的 `size` 照收不用。
  - `dailyClaim`：账号还没有当前名字时，接过设备的名字。
  - `dailyBoard` 不再返回 `lastNickname`。
- **web**：
  - `daily-table.tsx` 的 `Nickname`：只显示「Auf der Rangliste als X · Ändern」，点了就地改；不能用的名字和重名分别提示。去掉了「wäre Platz …」和「Auf die Rangliste」两段。
  - `daily-api.ts`：`dailyName(nickname)`。
  - `DailyBoard` 类型去掉 `lastNickname`。
  - 文案：新增 `daily_nick_taken`，删掉 `daily_would_be`、`daily_nick_join`；每日赛页说明（`daily_scoring_text`）改为「打完立即上榜，名字随机、可改」（de/en）。
  - 隐私说明和使用条款（`lib/legal.ts`，de/en）：打完自动以随机名出现在公开榜上、名字可改；`LEGAL_UPDATED` 改为 2026-10-12。
- **charter**（人在 grill 第 4 条同意）：
  - product.md：打完立即上榜；随机名的规则；可以改名；红线原话。
  - engineering.md：`daily_players`、名字写进记录、改名只改今天；`nickname.ts` 的职责。
  - operations.md：清除不当名字的运维命令，改为把记录里这个名字设为 NULL、删掉玩家的当前名字，服务重启时自动换一个新的随机名；只在人点名时执行。
  - ui.md：结果处的「Auf der Rangliste als … · Ändern」。

## AC results

在构建产物上验证（web 55090，multiplayer 56090，数据库 57090）。牌局由 `tmp/lib.mts` 走合法着法推进。先用本单之前的代码 `26da949`（本地主目录）在同一个数据库里造老数据（`tmp/old.mts`），再换成本单代码检查（`tmp/new.mts`，以及浏览器 `tmp/ui.mjs`）。全部 PASS。

1. **打完就上榜** — PASS。新设备打完 6 副赛，什么都不填，榜上就有它，叫「Nordischer Specht」；再打完 12 副赛，榜上还是「Nordischer Specht」。浏览器里，桌面和手机都显示「Auf der Rangliste als … · Ändern」，没有填名字的表单，自己那一行的名字一致。
2. **不撞名，没有数字** — PASS。连续 6 个玩家分到的名字是 Nordischer Specht、Schlauer Bär、Edle Libelle、Helle Eule、Tapferer Kolibri、Rascher Hirsch，各不相同，都不带数字。单元测试证明只有全部被占用时才加数字。
3. **改名** — PASS。
   - API：P3 改名为「Neuer Dritter」，今天 6 副和 12 副两条记录都变了，昨天两条「GesternName」一个字没变。「altname」（和别人的 AltName 只差大小写）返回 `nickname_taken`；「Arschloch」返回 `nickname_refused`；从没打完过的设备返回 `not_finished`。
   - 浏览器（桌面和手机）：输入「altname」时提示「Dieser Name ist schon vergeben.」；改成「Mein Test」「Mein Handy」后，6 副和 12 副两个榜都跟着变。
4. **老玩家和登录** — PASS。老玩家 P1 仍叫「AltName」；P3 的当前名字是他最后设的「ZweiterName」。游客改名为「GastName」后转到新账号，账号的当前名字和记录都是「GastName」。
5. **红线：已有名字一个都不改** — PASS。改动前导出的 5 个名字（今天的 AltName、ErsterName、ZweiterName，昨天的两条 GesternName）上线后完全一样；新增的只有原来是 NULL 的两条（P2 的今天和昨天），补上的是「Schlauer Bär」。

机械防线全部通过：typecheck、build、118 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`（46 个可索引页面）、`test:seo` 25/25。`npm --prefix multiplayer run check` 21/21。

## Deviations

- 名字仍按每条记录存，没有像最初方案那样「一个人一个名字、处处同步」。原因是人在 grill 第 1 条定的红线：已有名字绝不改。新增的 `daily_players` 只存当前名字。
- 自己改名时，会改到今天已打完的记录（以前「当天午夜前可以改」也是这样）。人是否认为这也在红线之内，待检阅时确认；如果是，只需在 `dailyName` 里去掉更新今天记录的那条语句。
- 新的随机名会避开记录里所有出现过的名字，不只避开当前名字，以免和过去榜上的人同名。
- 浏览器检查时发现每日赛页说明里还写着「用昵称上榜」，已一并改掉。

## Environment

- 实际端口：web 55090，multiplayer 56090，数据库 57090。
- 没有新增、修改或删除环境变量。

## Residual

- 上线时：multiplayer 启动会建表、迁移，并给生产上以前打完却没名字的记录补名字（`daily_named` 日志里有条数）。先部署 multiplayer，再部署 web。
