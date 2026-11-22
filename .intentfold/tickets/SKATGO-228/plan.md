# SKATGO-228 plan

## 代码和数据里看到、工单没说的
- 每个页面都必须德英两版：`check:seo` 断言每个 sitemap 条目覆盖全部语言、alternates 互指，每个可收录页面至少 200 字可见 SSR 文本和两个正文内链（SKATGO-226 时验证过）。
- 页面版式现成可用：About 页的阅读栏（`dims.readingColumn` 860 px）、叫牌表页的 `<table>` 样式（`panelLabel` 表头、`hairline` 分隔、手机上缩小内边距）。没有现成的"表格在自己框里横向滑动、第一列固定"的样式，要新写，但只用现有 token（`ui.md` Redline 1：改 token 注册表要人同意，本单不改）。
- SkatGo 自己的事实（2026-11-22 从代码数出来）：11 节课程；叫牌练习 150 题（`practice.data.ts`）；明牌残局 20 题，前 2 题不用登录（`LADDER_FREE = 2`）；自由对局的 power-up "Gewinnchancen"、"Kartenzähler"；自由对局和"1 Spiel heute"不用账号；6 副的锦标赛、联赛（六个段位）、私人房间要免费账号；德英双语；没有广告、没有任何付费（金币不卖）；对手是 SkatZero。
- 截图：站点用 `cwebp` 生成 WebP（`make-card-images.mjs` 的做法）；`engineering.md` 把生成的资源和它们的生成脚本登记在 "Generated, never hand-edited"。本单的 SkatGo 截图也用一个提交进仓库的脚本从本地运行的产品生成，不手工截图。
- 只读生产页面可以截图（如 /daily 的排行榜）；凡是会在服务器上开局的截图（自由对局牌桌）只在本地栈上截，不碰生产数据（operations.md Redline 2 的精神）。
- `product.md` 每个页面都有一段描述，改它要人明确同意（Redline 1）；页脚链接清单写在 `ui.md` 的 Footer 一行。

## 路线
1. 一次性爬取各站（官网/应用商店），事实和来源记在 `tmp/facts.md`（不提交原始抓取），选出能核实的站。
2. 页面 `/skat-online-vergleich`（英语 `/en/skat-sites-compared`）：
   - H1 + 两句导语（为什么有这页、核实日期）；
   - 对比矩阵：行 = 网站（SkatGo 是普通一行），列 = 对手、不登录能否玩、平台、费用、真钱、比赛、学习、语言；单元格是 ✓/✗ 加一两个词；手机上表格在自己的框里横向滑动、第一列固定，页面本身不横向滚动；
   - SkatGo 专区：3–4 张功能卡，每张一张 SkatGo 截图 + 粗体标题 + 一句话（逐墩对比 AI、同牌锦标赛、零门槛、练习题量和 power-up）；
   - 各站简介：两列卡片网格，每站一张带锚点：适合谁、值得知道的事实、官网链接（`rel="nofollow noopener"`）；
   - 常见问题 5–6 条，同时输出 FAQPage；
   - 核实日期和商标说明。
3. 文案进 `messages/*.json`；各站事实放一个数据文件 `app/src/lib/compare.ts`（每条带来源网址和核实日期的注释，页面只渲染这里的数据）。
4. 截图脚本 `app/scripts/make-compare-shots.mjs`（Playwright → PNG → `cwebp` → `app/public/compare/*-{de,en}.webp`）。
5. 入口：About 页 + 页脚（页脚需改 `ui.md`，见 grill）。
6. `product.md`、`engineering.md`、`ui.md` 补对应条目；`PAGES`、URL pattern、`client-page` 注册、og 图片（沿用 `home`）。
7. 机械防线、AC 检查、截图、交给人看。
