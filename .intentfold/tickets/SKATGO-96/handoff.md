# SKATGO-96 handoff

## 改了什么
- **刷新后接着打**（`free-api.ts` `keepGame`/`keptGame`，`server-table.tsx`）：自由对局把令牌和这一轮已打完的几副存在本浏览器 localStorage（`skatgo.free.v1`）。打开自由对局时先取切换语言带来的，再取保存的，用已有的 `/free/resume` 接着打；令牌过期（24 小时）或读不到就开新的一轮。一轮打完出现「Deine Runde」时清掉。第 11 课不保存。服务器仍不按局存任何东西。
- **牌桌右上角的退出按钮**（`game-table.tsx` `TableMenu`）：所有全屏牌桌（自由对局、每日赛、好友牌桌），和左上角的 AI 助手按钮对称，白色圆按钮。点开小菜单：
  - 「Weiterspielen」；
  - 自由对局「Neue Runde」，先问「Diese Runde abbrechen? Du beginnst wieder mit Spiel 1.」，再选「Ja, neue Runde」或「Nein, weiterspielen」；
  - 「Tisch verlassen」：自由对局去首页，每日赛去 `/daily`，好友牌桌去 `/with-friends`。
  
  Esc 和点菜单外会关闭菜单。侧栏底部的「Tisch verlassen」删除。
- **新令牌**：`dims.tableMenu` 240px（菜单宽度）。新消息（德英）：`table_menu`、`table_continue`、`table_menu_back`、`free_round_abandon`、`free_round_abandon_yes`。
- **隐私说明**（德英）：自由对局的令牌存在本浏览器，刷新会接着打，服务器不按局存储。
- **charter**（人已同意）：
  - engineering.md 的 free play 存储规则；
  - product.md 的刷新、放弃整轮、每日赛不能放弃；
  - ui.md 新增「The way out of a table」。

## 验证
- 机械检查全过：typecheck、build、单元测试 118/118、client bundle、设计令牌、git grep、SSR 链接、SEO（46 页）、SEO 测试 25/25。
- 浏览器 `tmp/ac.mjs`（有头，桌面 1280×820、手机 375×812；自由对局的牌由 `tmp/stage.mts` 用合法着法走到最后一张，只出最后一张）：AC1–AC4 共 21 项全过。
  - 第 2 副（已出 9 墩）刷新、关页再开都完全一样；
  - 「Neue Runde」取消不变、确认后回到第 1 副、0 分；
  - 离开后再进回到原来那一副；
  - 三种牌桌在手机和桌面上都能直接看到按钮，侧栏里没有退出按钮，每日赛和好友牌桌没有「Neue Runde」，离开去对的地方；
  - 隐私说明德英都已改。
- 开发中发现并改掉：确认框里「Nein, weiterspielen」原先只是退回菜单，现在直接关闭菜单，和字面意思一致。

## 服务
web http://127.0.0.1:55096、multiplayer 56096、本地数据库 57096 在跑。
