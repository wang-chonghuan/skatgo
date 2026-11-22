# SKATGO-226 plan

## 代码里看到、工单没说的
- 站点的每个页面都是两种语言：路由经 Paraglide 生成德/英两个地址，`lib/sitemap.ts` 的 `sitemapXml` 给每页写全部语言的 alternates，`npm run check:seo` 断言每个 sitemap 条目覆盖全部语言（"language coverage"）且 alternates 互相指向。只做德语的页面与这条机械检查冲突（见 grill 1）。
- 德语里 "KI" 有两种用法：指对手（牌桌、房间、自由对局、首页、课程第 11 课）和指作为参照/分析的 AI（"auf denselben Karten gegen die KI"、XP 档、叫牌练习的答案、赛后对比）。工单只改前一种。
- Skat Palast 自己的网站（2026-11-22 核实）：免费；和真人打；手机和平板的 app 可以不建账号直接玩；有可选的付费 Premium；有 Skat-Schule（文字课程）、联赛、锦标赛、俱乐部。所以"不用注册"不是两家的区别。
- `product.md` 逐项写了产品有哪些页面；新增页面要在那里加一段，而 product.md 的 Redline 1 要求人明确同意才能改。

## 路线
1. 德语文案 KI → Computer（`messages/de.json`，课程第 11 课 `content.de.ts`、`guide.de.ts`）：只改指对手的说法；首页 `home_meta_description` 重写。英语不动。
2. 新页面 `/skat-palast-alternative`（德语地址同名）：`routes/skat-palast-alternative.tsx`（经 `client-page`）、`components/skat/palast-page.tsx`（沿用 About 页的版式和 token，不加新 token）、文案进 `messages/*.json`、`pageHead`（title、description、canonical、JSON-LD WebPage + breadcrumbs）、加入 `PAGES`。
   - 内容：SkatGo 是什么；两家对比（只写核实过的事实，标明 Skat Palast 的长处：真人、社区、联赛）；什么时候 SkatGo 更合适（随时和电脑打、不用等人、每副牌和 AI 在同样的牌上对比、每日锦标赛、互动课程、不卖任何东西）；按钮进入自由对局；商标说明。
   - 语言：德英两版（grill 1），英语版是同一页的翻译，对准 "Skat Palast alternative"。
3. 从 About 页加一条链接到新页。
4. `product.md` 加一段描述新页面（人已同意，grill 2）；`engineering.md` Structure 表补新页面文件。
5. 跑 `npm run check:seo`、机械防线，截图。
