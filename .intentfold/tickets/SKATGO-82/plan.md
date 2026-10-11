# SKATGO-82 plan

## 代码里有、工单没写的

- **「Aufgaben」占位**：
  - 顶部导航和手机菜单里是灰色、不可点的 `<span data-nav="puzzles">`（`frame.tsx`），文案 `nav_header_puzzles`。
  - 首页还有一张「Skat-Aufgaben · Bald verfügbar」卡片（`entry-page.tsx`，`stillLook`）。人已要求把它改成 Tricks 卡片，换名字和文案。
- **可照着做的阅读页**：规则页的模式是「内容数据文件 + 渲染组件 + 薄路由」：`lib/skat/rules/content.{de,en}.ts`、`rules-page.tsx`、`routes/rules.tsx`，并有内容测试 `rules.test.ts`。
- **地址**：由 `paraglide.options.ts` 的 urlPatterns 决定；`sitemap.ts` 的 `PAGES` 必须和路由树一致（`sitemap.test.ts` 会检查）；SEO 检查从路由和 sitemap 推导覆盖范围。
- **「差别最大的一墩」**：是 `daily-comparison.tsx` 里 `AnalysisBody` 的 `daily-review-result`。每日赛结算、`/daily` 的每一行、自由对局的结果三处共用它。
- **牌桌侧栏的规则页**：`RulesInPanel`。现在它刻意不放任何会离开牌桌的链接。在牌桌里点链接离开当前页面，自由对局会丢掉正在打的这局（刷新就重开）。
- **页脚**：`LegalFooter` 只有三个法律链接。
- **分享预览图**：`og.mjs` 按页面的 `og:image` 和 h1 画，`image` 名在 `pageHead` 里指定。
- **charter 漂移**：
  - ui.md 写「header 有四个链接」，实际已有私人牌桌和 Aufgaben；
  - product.md「What this product is」的列举里没有私人牌桌，也没有 Tricks。

## 路线

1. **内容**（`app/src/lib/skat/tricks/`）：
   - `types.ts`：文章的结构是 meta title、description、h1、引言，然后若干块：小标题、技巧（编号、标题、段落、可选的站内链接）、引导块。
   - `content.de.ts`：以工单的德文稿为底，改写得深入浅出；去掉 Buchtipps。
   - `content.en.ts`：忠实翻译。
   - `index.ts`。
   - 技巧 2 的基础分直接从 `value.ts` 取（`SUIT_BASE`、`GRAND_BASE`），不手写数字。
   - 以后的文章放 `TRICK_ARTICLES` 列表，现在是空的。
2. **页面**：
   - `components/skat/tricks-page.tsx` 在服务端渲染，复用规则页的栏宽、字体和样式。
   - 引导块用 `Panel tone="tip"`，按钮用 `linkLook('go', …)` 链到 `/daily`。
   - 文末是「Weiterlesen」的站内链接（Regeln、Reiztabelle、Kurs）；「Mehr Skat-Tricks」列表为空时不显示。
3. **路由**：`routes/skat-tricks.tsx`，用 `pageHead` 设置 title、description、canonical、hreflang、`image: 'tricks'`，结构化数据为 Article 加面包屑；`paraglide.options.ts` 加 `/de/skat-tricks` 和 `/en/skat-tricks`；`sitemap.ts` 的 `PAGES` 加上它；`client-page.tsx` 登记这个页面。
4. **入口**：
   - 导航和手机菜单：灰色的 Aufgaben 换成 `<Link to="/skat-tricks">Tricks</Link>`，文案 `nav_header_tricks`。
   - 首页卡片：按 grill 定的名字、文案和按钮。
   - 课程页：课程列表下面加一张选项卡片「Skat-Tricks」。
   - 结算里「差别最大的一墩」下面加「Mehr Skat-Tricks」链接，按 grill 定是否在新标签页打开。
   - 侧栏规则页：顶部加「Skat-Tricks」链接，同上。
   - 页脚加「Skat-Tricks」。
5. **测试**：`tricks.test.ts` 检查两种语言都有 12 条、3 个引导块，主关键词出现在 h1、meta title 和至少一个 h2 里，站内链接都指向存在的路由。
6. **生成物**：用 `og.mjs` 画 `tricks-de.png` 和 `tricks-en.png`。
7. **charter**：按 grill 由我起草、人确认后修改。

## 和工单建议方案的出入

无。路由加内容文件、复用引导块按钮、Article 结构化数据都照工单建议。
