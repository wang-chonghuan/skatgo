# SKATGO-96 plan

## 代码里有、工单没写的
- 自由对局的局全在页面内存里（`server-table.tsx`），令牌 24 小时有效（`multiplayer/src/free.ts` `TOKEN_MS`），`/free/resume` 能凭令牌接着打。切换语言时令牌和这一轮已打完的几副放进网址 `#game=…&round=…` 带过去（`free-api.ts` `holdGame`/`carryGame`/`takeCarriedGame`）。
- 「刷新开新的一局」写在 charter engineering.md（free play 一节）、product.md（free play 段落末句）和隐私说明（`lib/legal.ts`，德英）。
- 退出按钮在侧栏底部 `panelFoot`（`game-table.tsx`），每日赛去 `/daily`、好友牌桌去 `/with-friends`、自由对局去 `/`。手机上侧栏是收起的抽屉。
- AI 助手按钮在牌桌左上角（`ask.tsx` `launcherAtTable`），大小 `dims.launcher`。
- 一轮打完的「Deine Runde」已有「Neue Runde」（`newRound`）。

## 路线
1. `free-api.ts`：`keepGame(token, round)` / `keptGame()`，localStorage 读写，全部 try/catch，读不了就当没有。
2. `server-table.tsx`：
   - 打开时先看切换语言带来的，再看保存的，有就 `resume`，没有就 `start`；
   - 自由对局每次令牌或这一轮变化时保存，出现「Deine Runde」时清掉；
   - 把 `newRound` 交给牌桌（`ServerGame.newRound`）。
3. `game-table.tsx`：全屏牌桌右上角 `TableMenu`：圆按钮（`LogOut` 图标），点开小菜单：
   - 「Weiterspielen」；
   - 自由对局「Neue Runde」，先问一句再执行；
   - 「Tisch verlassen」，链接按牌桌类型。
   Esc 和点菜单外关闭。删掉侧栏底部的退出链接。
4. 消息（德英）：菜单名、Weiterspielen、确认问句、确认和取消按钮。
5. 隐私说明（德英）改写自由对局一句，`LEGAL_UPDATED` 改日期。
6. charter：engineering.md、product.md 关于刷新的句子；ui.md 关于「Tisch verlassen」和右上角按钮的描述。

## 检查
整套机械检查；构建产物上 Playwright（web 55096、multiplayer 56096），牌局用脚本合法着法推进，不手动打牌。
