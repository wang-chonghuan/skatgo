# SKATGO-91 handoff

## 改了什么
- 首页大标题下的导语缩成一句：
  - 德文 „Spiel gegen die KI, mit Freunden oder im Turnier – mit KI-Coach.“（127 → 64 个字符）
  - 英文 "Play the AI, your friends or the community – with an AI coach."（112 → 62）
- 导语的字体角色 `landingHeroLead`（只有这里用）从 28/24px 加粗改为 20/17px、正文粗细（500）、行高 1.5。令牌改动经人同意（grill.md）。
- 标题、按钮、✓ 行、卡片、charter 都没动。

## 验证
- engineering.md 机械检查全过：typecheck、build、单元测试、client bundle、设计令牌、SSR 导入、SEO（46 个可索引页面）、SEO 测试 25/25。
- 构建产物 web 55091，Playwright 有头浏览器，桌面 1280×820、手机 375×812，德文 `/` 和英文 `/en`：AC1–AC3 共 20 项全过（`tmp/ui.mjs`）。导语桌面一行、手机两行；标题仍是 66px / 32.25px、900；没有横向滚动。截图在 `tmp/`。

## 服务
web http://127.0.0.1:55091 （德文 `/`，英文 `/en`）正在跑。
