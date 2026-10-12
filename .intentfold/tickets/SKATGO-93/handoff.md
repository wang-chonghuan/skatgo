# SKATGO-93 handoff

## 改了什么
- 首页 ✓ 行德文第三项 „KI-Analyse“ → „Analyse mit KI“。
- 首页课程卡删掉「x von 11 Lektionen geschafft / x of 11 lessons done」那行小字和只给它用的样式；课程页的进度卡不动。
- charter 没改。

## 验证
- engineering.md 机械检查全过：typecheck、build、单元测试 118/118、client bundle、设计令牌、git grep、SSR 链接、SEO（46 个可索引页面）、SEO 测试 25/25。
- 构建产物 web 55093，Playwright 有头浏览器，桌面 1280×820、手机 375×812，localStorage 写入两课已学完：AC1–AC3 共 18 项全过（返工后 AC1–AC4 共 26 项）（`tmp/ui.mjs`），截图在 `tmp/`。

## 返工（人：「你把这几个地方的中英文连字符改对，别墨迹」）
- 英文 ✓ 行 "No sign-up" → "No account needed"。
- 速成课按钮 „5-Minuten-Crashkurs“ → „Crashkurs in 5 Minuten“，"5-minute crash course" → "Crash course in 5 minutes"；规则页那行链接同步改（德英）。
- 重跑 typecheck、build 和浏览器检查（加了 AC4），26 项全过。
- 没动：英文 SEO 标题和描述里的 "no sign-up"、页面网址 `skat-in-5-minuten`；charter ui.md 第 254 行还写着旧按钮名 „5-Minuten-Crashkurs“（charter 归人管，没改）。

## 返工 2
- 结果框打开时不再往下滚：滚进视野的是框本身（`game-table.tsx` `Result`），框内从顶部开始，内边距完整。
- 计分表「Your seat / Dein Platz」表头去掉灰底，分数格保留（`daily-comparison.tsx`）。
- 牌桌信息板「Augen」下改为第几副（`info_deal` „Spiel n von x“ / "Deal n of x"）：自由对局 x/6，第 11 课 1/1，比赛 x/6 或 x/12；好友房间留空。侧栏的「Stich n von 10」标签删除，`info_tricks` 消息删除。
- 检查：typecheck、build、单元测试、client bundle、设计令牌、git grep 全过；浏览器 `tmp/table.mjs` 16 项全过（自由对局桌面和手机、第 11 课、6 副赛桌面、12 副赛手机）。

## 返工 3：加载界面
- 新组件 `table-loading.tsx`：毛毡上，白色渐变圆里转动的 logo（`logo-mark.png`，透明底，`tmp/make-mark.mjs` 由 icon-512.png 生成）。转动中心是三个花色的中心，不是图片中心；减少动画时不转；纯 CSS，脚本没跑也会转。
- 用在：自由对局、每日赛、好友牌桌的加载占位（原来是插画或空毛毡）；自由对局（全屏）和每日赛牌还在路上时。插画只留在首页。
- 新增令牌：`timing.spin`、`timing.steady`、`turn`（effects）、`fill.loaderGlow`（elevation）、`dims.tableLoader`、`dims.tableLoaderMark`（shape）。新消息 `table_loading`（屏幕阅读器读的「Der Tisch wird vorbereitet …」）。
- 检查：typecheck、build、单元测试 118/118、client bundle、设计令牌、SEO；浏览器 `tmp/loading.mjs` 9 项全过（含转动中心实测：偏差 0.3px 以内）。

## 服务
web http://127.0.0.1:55093、multiplayer 56093、本地数据库 57093 在跑。
