# SKATGO-56 plan

只改 `.intentfold/charter/` 下四个文件。每条都已对照代码核实过：`app/src/routes/`、`app/src/theme/`、`components/skat/`、`package.json`、`scripts/`、`multiplayer/scripts/`。

## product.md

- 删掉开头 cap1 播种时的说明块。里面说「人没说的留作提示」，现在已经不是这样。
- 首行的「从不编辑」与 Redline「经人批准可编辑」矛盾，改成一致的说法。
- 「这是什么」补上实际存在的自由对局（`/play`）和规则参考（规则页、叫牌表、记分表、规则摘要）。
- 「它不是什么」里「只有课程和每日赛」与现状矛盾，改写，保留「不带 Parrottoon 的内容、不链回 Parrottoon」。
- 删掉旧年龄 12+ 和旧首页契约的历史说法，只保留现状。
- 删掉模板占位：非目标的占位条，以及 Redline 1 的占位。Redline 重新编号。

## engineering.md

- Stack：
  - 服务端端点补上 `/api/free/*`；
  - 补上 Paraglide（多语言）和 posthog-js（统计）。
- 路由表补 `/rules/score-sheet`、`/rules/printable`。
- 路径表补可打印资料一行：页面组件、`print-links.tsx`、`lib/printables.ts`、`lib/origin.ts`、`public/downloads/`。
- Tools：
  - 删掉空的「Architecture and generation」小标题；
  - SEO 说明的相对路径多了一层 `../`，改正；
  - 搜索面说明补「链接到的文件要带 canonical」；
  - 新增 PDF 生成命令以及何时重跑；
  - 「生成文件」独立成一段；
  - 删掉「SKATGO-20 的主要交付物」这类历史说法。

## ui.md

- 尺寸一节补 `dims.scoreRow`。
- 图标清单补下载按钮。
- 组件表补下载写法（`TitleWithDownload` / `PdfLink`）和 `PrintLinks`。
- 子页面列表补记分表和规则摘要。
- 打印规则补「打印资料一页或两页 A4，PDF 由打印样式生成」。
- 「The tables」和「Public search content」重复描述自由对局的阅读区，合并成一处。

## operations.md

- 本地环境变量补 `POSTHOG_PROJECT_KEY`。
- Runtime 补「web 原样提供 `public/downloads` 下的 PDF，带 canonical 头」。
- Search consoles 补每日配额（今天实测）：Google 网址检查每天约 10 次，Bing URL 提交每天 100 个。

## Redline 查对

- product.md 的「编辑本文件需人批准」：人已在 Request 里授权全部 charter。
- 不改产品代码，其余 Redlines 不涉及。
