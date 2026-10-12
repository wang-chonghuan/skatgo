# SKATGO-93 handoff

## 改了什么
- 首页 ✓ 行德文第三项 „KI-Analyse“ → „Analyse mit KI“。
- 首页课程卡删掉「x von 11 Lektionen geschafft / x of 11 lessons done」那行小字和只给它用的样式；课程页的进度卡不动。
- charter 没改。

## 验证
- engineering.md 机械检查全过：typecheck、build、单元测试 118/118、client bundle、设计令牌、git grep、SSR 链接、SEO（46 个可索引页面）、SEO 测试 25/25。
- 构建产物 web 55093，Playwright 有头浏览器，桌面 1280×820、手机 375×812，localStorage 写入两课已学完：AC1–AC3 共 18 项全过（`tmp/ui.mjs`），截图在 `tmp/`。

## 没改、但也带连字符的
- 英文 ✓ 行 "No sign-up"；课程卡按钮 „5-Minuten-Crashkurs“ / "5-minute crash course"。不在本单范围。

## 服务
web http://127.0.0.1:55093 在跑。
