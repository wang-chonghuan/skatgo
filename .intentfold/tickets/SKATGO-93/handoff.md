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

## 服务
web http://127.0.0.1:55093 在跑。
