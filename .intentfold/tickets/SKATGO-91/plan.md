# SKATGO-91 plan

## 代码里有、工单没写的
- 导语是 `entry_lead`（`app/messages/{de,en}.json`），只在 `entry-page.tsx` 首页大标题下用。
- 字体角色 `landingHeroLead`（`app/src/theme/type.ts`）：28/24px、`weight.bold`、`leading.tight`，全站只有这里用。颜色由页面给（slate），不在角色里。

## 路线
1. `type.ts`：`landingHeroLead` 改成 `fontSize.f20` / 手机 `f17`、`weight.text`、`leading.ui`（正文一行的行高），注释写明来由。
2. `de.json`、`en.json`：`entry_lead` 换成 grill 定的一句话。
3. 不动标题、按钮、✓ 行、卡片；不改 charter（ui.md 只提角色名，仍然对）。

## 检查
engineering.md 的整套机械检查；然后在构建产物上（web 55091）用 Playwright 有头浏览器，桌面 1280×820、手机 375×812 看首页德文和英文，量导语的字号、粗细、行数，以及标题和按钮的位置。
