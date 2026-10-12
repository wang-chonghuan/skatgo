# SKATGO-93 acceptance checks

构建产物 web 55093，Playwright 有头浏览器，桌面 1280×820、手机 375×812。用 localStorage 写入两课已学完（不打牌）。

## AC1 ✓ 行没有连字符
- 德文首页 `/` 的 ✓ 行三项是「Kostenlos」「Ohne Anmeldung」「Analyse mit KI」，整行没有 `-`；英文 `/en` 是「Free」「No account needed」「AI analysis」，也没有 `-`。

## AC2 首页课程卡没有进度小字
- 学过两课时，德文 `/` 和英文 `/en` 的课程卡里没有 „von 11 Lektionen geschafft“ / "of 11 lessons done"；继续学习按钮（„… Lektion 3“ 一类）和 5 分钟速成按钮都在。

## AC3 课程页进度还在
- 同一状态下，`/de/kurs` 和 `/en/course` 的进度卡显示 „2 von 11 Lektionen geschafft“ / "2 of 11 lessons done"。

## AC4 速成课的名字没有连字符
- 首页课程卡的按钮：德文 „Crashkurs in 5 Minuten“，英文 "Crash course in 5 minutes"。
- 规则页 `/de/regeln`、`/en/rules` 的链接是 „Neu beim Skat? Der Crashkurs in 5 Minuten“ / "New to Skat? The crash course in 5 minutes"，页面上不再出现旧写法。

## 返工 2（人：结果页顶部没有 padding、Your seat 被灰色遮住、牌桌显示第几副而不是第几墩）
构建产物 web 55093、multiplayer 56093、本地数据库 57093。自由对局和第 11 课的牌由 `tmp/stage.mts` 用合法着法走到最后一张，浏览器里只出最后一张（`tmp/table.mjs`）。

## AC5 牌桌显示第几副
- 牌桌信息板「Augen」下面：自由对局 „Spiel 1 von 6“，第 11 课 „Spiel 1 von 1“，6 副赛 „Spiel 1 von 6“，12 副赛 „Spiel 1 von 12“。
- 页面上任何地方都不再出现 „Stich n von 10“。

## AC6 结果框从顶部打开
- 打完后结果框的 scrollTop 是 0，第一张卡（输赢）离框顶不少于框的内边距（24px），桌面和手机都是。

## AC7 「Dein Platz」不被灰色遮住
- 计分表表头「Dein Platz」没有底色；它下面的分数格仍是灰色底。

## 返工 3（人：等待界面用 logo 动画代替插画）
`tmp/loading.mjs`，构建产物 web 55093，桌面和手机。

## AC8 牌桌加载时转 logo，不再是插画
- 自由对局页还没运行脚本时（关掉 JavaScript）、自由对局和 12 副赛的牌还在路上时（请求被挂住）：毛毡上是转动的 logo（`logo-mark.png`），没有 `hero-table.webp`；logo 在画面水平居中，加载区铺满一屏。
- 系统设了减少动画时，logo 不转。

## AC9 绕正确的中心转
- 把 logo 停在 0°、120°、240° 截图：方块的三个位置所在圆的圆心（转动中心）离白圆中心不超过 1.5px；三个花色中心所在圆的圆心也在白圆中心。
- 白圆边缘渐变到毛毡，没有硬边；转动时 logo 的白底不会伸出圆外（logo 用透明底）。
