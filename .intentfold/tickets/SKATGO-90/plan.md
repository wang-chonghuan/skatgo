# SKATGO-90 plan

## 代码里有、工单没写的

- **名字现在怎么存**：存在 `daily_entries.nickname`，每天每个赛每条记录各一份。
  - `dailyName` 只能给「今天打完的这条记录」起名。
  - `dailyBoard` 只列 `nickname IS NOT NULL` 的记录。
  - `lastNickname` 用来在下一次打完时预先填好上次的名字。
- **登录认领**（`dailyClaim`）：只把今天的记录从设备转到账号。
- **界面**（`daily-table.tsx` 的 `Nickname`）：没名字时显示「Deine Summe … wäre Platz …」和填名字的表单；有名字时显示「Auf der Rangliste als X · Ändern」。
- **名字规则**：`app/src/lib/skat/nickname.ts` 的 `cleanNickname`（2–20 个字符、允许的字符、屏蔽词），网页和服务器共用。
- **文字**：
  - 隐私说明（`lib/legal.ts`）写的是「提交了昵称才公开」，使用条款写的是「你提交的昵称」，都要改。
  - charter：product.md、engineering.md 都写着「打完的玩家放上榜的昵称」；operations.md 里的运维命令是按天清除昵称。

## grill 之后的改动（人：已有名字是绝对红线）

- **名字仍按每条记录存**：`daily_entries.nickname` 是榜上显示的名字，已有的值永远不改。
- **新表只存「当前名字」**：`daily_players` 只用来填新打完的记录。
- **改名的范围**：只改玩家的当前名字，以及他今天已打完、属于他的记录；过去的记录不动。
- **排行榜**：照旧读每条记录自己的 `nickname`。打完时就自动填上，所以每条打完的记录都有名字。

## 路线

1. **随机名**（`app/src/lib/skat/nickname.ts`）：
   - 加上工单约束里的词表：35 个形容词，每个写明阳性、阴性、中性三种词尾（比如 edel → edler / edle / edles）；50 个名词，各带词性。
   - `randomNames(seed)`：按玩家标识的哈希定一个起点，再用和 1750 互质的步长依次给出全部 1750 个不带数字的名字。
   - 测试：每个组合都通过 `cleanNickname`、都不超过 20 个字符、互不相同。
2. **multiplayer**：
   - 新表 `daily_players(player PRIMARY KEY, nickname, created_at)`。迁移时把每个老玩家最近一次设的昵称写进去（`ON CONFLICT DO NOTHING`，可以重复执行）。
   - `ensureName(c, player)`：玩家打完时在同一个事务里执行；还没有名字的，持事务级 advisory lock，按顺序挑第一个没被别人用过的名字（不分大小写）。1750 个全用完才加两位数。
   - leader 启动时，给以前打完、名字还是 NULL 的记录补上名字：用这个玩家的当前名字，没有的话先给他分一个。已有的名字一律不碰。
   - 记录打完时，把玩家的当前名字写进这条记录的 `nickname`（只写 NULL 的）。
   - `dailyBoard` 照旧读记录的 `nickname`，不再返回 `lastNickname`。
   - `dailyName` 改玩家的当前名字，以及他今天已打完的记录；和其他玩家的当前名字重名就拒绝（`nickname_taken`）。
   - `dailyClaim` 时，账号还没有名字，就接过设备的名字。
3. **界面**：
   - `Nickname` 改成「Auf der Rangliste als X · Ändern」，点了就地改；
   - 去掉「wäre Platz …」和「Auf die Rangliste」两条用不到的文案；
   - `DailyBoard` 类型去掉 `lastNickname`。
4. **文字**：隐私说明和使用条款（de/en）。
5. **charter**：按 grill 定。

## 和工单建议方案的出入

无。
