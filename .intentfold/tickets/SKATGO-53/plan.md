# SKATGO-53 plan

## 代码里已有、工单没说的

- SKATGO-50 已备好的：
  - 打印媒体查询 `bp.print`；
  - 全站打印时隐藏顶栏、页脚和助手；
  - 叫牌表页的「屏幕可见、打印隐藏」写法（`screenOnly`）。
  - 新页面照这个做。
- 规则数字都在引擎里：
  - `value.ts`：`SUIT_BASE`、`GRAND_BASE`、`NULL_VALUES`、`BID_LADDER`、`MIN/MAX_MULTIPLIER`；
  - `cards.ts`：`POINTS`。
- Seeger-Fabian 的 +50 / −50 / +40 现在是 `tournament.ts` 里 `seegerFabian()` 的裸数字。记分表的 SF 结算栏要用它们，所以要先导出成常量，行为不变。
- 网站没有生成 PDF 的服务端能力：生产镜像里没有 Chromium，也不能加依赖。Playwright 已是 app 的开发依赖（SEO 检查在用）。
  - PDF 只能在本地由打印样式生成，作为静态文件提交到 `app/public/downloads/`。Nitro 会原样提供 `public/` 下的文件。
- 页面标题要避开已被占用的词：Skat Regeln、Reiztabelle、Skat Abrechnung 等（SKATGO-52 的对照表）。
- 手写记分需要固定行高，A4 一页放下约 30 行加 SF 结算栏。注册表里没有合适的行高，要新增 token（ui.md Redline 1，需要人批准）。

## 路线

1. 引擎：`tournament.ts` 导出 `SEEGER_FABIAN`（won 50、lost 50、defender 40），`seegerFabian()` 改用它。
2. 记分表页 `/de/regeln/skatliste`、`/en/rules/score-sheet`：
   - 空白表：序号、Spiel、Wert、三名玩家各一列（写累计）；
   - 底部是 Seeger-Fabian 结算栏，数值来自引擎；
   - 屏幕上有简短用法说明和 PDF 下载链接，打印时只留表。
3. 规则摘要页 `/de/regeln/zum-ausdrucken`、`/en/rules/printable`：
   - 新文案 `lib/skat/rules/summary.{de,en}.ts`；
   - 所有表格数字从引擎渲染；
   - 打印不超过两页 A4。
4. PDF：新脚本 `app/scripts/make-printables.mjs`，用 Playwright 从构建好的页面打印出 4 个 PDF（德英各两份），提交到 `app/public/downloads/`。内容变了就重跑这个脚本。
5. 入口：规则页、叫牌表页、课程页加「Zum Ausdrucken」链接。新页面加进 Paraglide 路由映射和 sitemap 的 `PAGES`。
6. 预览图：4 个新页面，用 `og.mjs` 生成。
7. 报告 charter 偏差（只报告，不改）：engineering.md 的路由表和 Tools 里的 PDF 脚本，ui.md 的子页面列表。

## Redline 查对

- ui.md Redline 1：新增 `dims.scoreRow`（以及可能需要的列宽或打印字号），需要人批准。已列入 grill。
- ui.md Redline 2–4：不涉及。
- engineering.md：
  - Redline 3：不加依赖，Playwright 本来就是开发依赖；
  - Redline 4：新路由经 `client-page` 接入；
  - Redline 5、6、7：不涉及。
- operations.md：不涉及。
