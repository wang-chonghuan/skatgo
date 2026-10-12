# SKATGO-89 plan

## 代码里看到的（工单没写）
- **参照**：SKATGO-82 的 Skat-Tricks 页就是一个服务器渲染的静态内容页，可以照着做。它涉及：
  - 内容模块 `lib/skat/tricks/`（de/en 两份）；
  - 页面组件；
  - 路由文件，带 `pageHead` 和 JSON-LD；
  - `paraglide.options.ts` 里的多语言地址；
  - `lib/sitemap.ts` 的 `PAGES`（`sitemap.test.ts` 会核对它和路由树一致）；
  - `client-page.tsx` 的页面表；
  - `public/og/` 里的分享预览图（用 `og.mjs` 从页面的 h1 生成）。
- **地址**：课程下的各节课用的是 `/course/$slug`，slug 跟着页面语言变（`/de/kurs/…`）。
  - 这一页用静态路由 `/course/quick-start`。TanStack 里静态段优先于 `$slug`。
  - 在 `paraglide.options.ts` 里，它的多语言地址（de `/de/kurs/skat-in-5-minuten`，en `/en/course/skat-in-5-minutes`）要写在 `/course/:slug` 前面，不然会被当成某一课的 slug。
- **规则引擎里现成的东西**：
  - `POINTS`：各张牌的分值；
  - `strength`：Grand 下同一花色的大小、Null 下的大小；
  - `trumpSequence({kind:'grand'})`：四张 B 的顺序；
  - `CardRowView`：一行带说明文字的牌，课程里已经在用。
- **入口的位置**：
  - 课程页（`course-home.tsx`）的简介下面；
  - 首页「Neu beim Skat?」那块的按钮旁边（`entry-page.tsx`）；
  - 规则页（`rules-page.tsx`）的简介下面。

## 路线
1. **内容**：新建 `lib/skat/quickstart.ts`，放 de/en 两份。
   - 十二条照人的原文翻译，不增不减；
   - 第 6、8、10、12 条带一个牌面图的标记；
   - 另外是页面标题、一句引导语、meta 信息和底部链接的文字。
2. **页面**：`components/skat/quick-start-page.tsx`。
   - 阅读栏宽度，十二条按编号列出；
   - 配图用 `CardRowView`，牌和顺序都从引擎取，第 6 条每张牌下面标上分值；
   - 底部一个绿色按钮去 `/play`，再附课程和规则两个链接。
3. **路由**：`routes/course.quick-start.tsx`，带 `pageHead`、WebPage 和面包屑的 JSON-LD，分享图用 `quick-start`；同时在 `client-page` 里登记，在 `sitemap` 的 `PAGES` 里加上，并加上多语言地址。
4. **入口**：
   - 课程页：简介下面放一张选项卡片，样式和课程卡片一样；
   - 首页课程那块：按钮旁边一行小链接，只在还没学过课程时显示。服务器渲染时也显示，搜索引擎能看到；
   - 规则页：简介下面一行链接。
5. **分享预览图**：用 `og.mjs` 生成 `quick-start-de.png` 和 `quick-start-en.png`。
6. **charter**：
   - engineering.md：路由和文件职责；
   - ui.md：这一页和三个入口；
   - product.md：在课程那段补一句。按人在 SKATGO-79 关单时的授权（「改所有 charter…写上最新的」）。
