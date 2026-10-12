# SKATGO-93 plan

## 代码里有、工单没写的
- ✓ 行第三项是 `entry_point_ai`（`app/messages/de.json` „KI-Analyse“，英文 "AI analysis"）。
- 首页课程卡的小字是 `entry-page.tsx` 里 `finished > 0` 时的 `home_done` 那个 span（样式 `styles.aside`）。`home_done` 在 `course-home.tsx` 的进度卡里也用，所以消息保留。

## 路线
1. `de.json`：`entry_point_ai` 改为 „Analyse mit KI“。
2. `entry-page.tsx`：删掉那个 span 和只给它用的 `styles.aside`，留一行注释说明进度在课程页。
3. 不改 charter（ui.md、product.md 都没写首页课程卡上的进度字）。

## 检查
engineering.md 整套机械检查；构建产物（web 55093）上 Playwright 有头浏览器，桌面 1280×820、手机 375×812，往 localStorage 写入两课已学完，再看首页和课程页。
