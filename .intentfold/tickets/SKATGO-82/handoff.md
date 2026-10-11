# SKATGO-82 handoff

## What changed

- **内容**（`app/src/lib/skat/tricks/`）：
  - `types.ts`：文章结构为 meta、h1、引言，加小标题、技巧、引导块三种内容块，最后是延伸阅读。
  - `content.de.ts`：以工单德文稿为底，按人的要求改写得深入浅出：每条先说怎么做，再说为什么；第一次出现的术语（Trumpf、Augen、drücken、Alleinspieler、Gegenspieler、blank、schmieren）当场解释。Buchtipps 已去掉。
  - `content.en.ts`：忠实翻译。
  - 技巧 2、3 里的基础分和牌点从 `value.ts`、`cards.ts` 取。
  - `tricks.test.ts`：两种语言都有 12 条、按顺序编号；3 个引导块，位于开头、中间和结尾；关键词出现在 title、h1 和 h2；站内链接都指向 sitemap 里的页面。
- **页面**：
  - `components/skat/tricks-page.tsx` 在服务端渲染，版式和规则页一致；引导块是 `Panel tone="tip"` 加绿色按钮去 `/daily`。
  - `routes/skat-tricks.tsx`：title、description、canonical、hreflang，结构化数据为 Article 加面包屑，分享图 `tricks`。
  - `paraglide.options.ts` 新增地址 `/de/skat-tricks`、`/en/skat-tricks`；`sitemap.ts` 的 `PAGES` 和重新生成的 `routeTree.gen.ts` 都已更新；`client-page.tsx` 登记了这个页面。
- **入口**：
  - **顶部导航和手机菜单**（`frame.tsx`）：灰色「Aufgaben」换成「Tricks」链接；删掉不再用的 `soon` 样式和 `opacity` 导入。
  - **首页卡片**（`entry-page.tsx`）：标题「Skat-Tricks」，文案和按钮「Tricks lesen」按 grill 第 1 条，链到文章，颜色和插画不变；`ui.tsx` 删掉不再用的 `stillLook`。
  - **课程页**（`course-home.tsx`）：课程列表下面加一张「Skat-Tricks」选项卡片。
  - **页脚**（`legal-page.tsx`）：加「Skat-Tricks」。
  - **牌桌侧栏规则页**（`rules-page.tsx` 的 `RulesInPanel`）：顶部加「Skat-Tricks」，在新标签页打开。
  - **「差别最大的一墩」下面**（`daily-comparison.tsx` 的 `AnalysisBody`）：加「Mehr Skat-Tricks」，在新标签页打开。每日赛结算、`/daily` 的行、自由对局的结果三处都有。
- **文案**：新增 `nav_header_tricks`、`tricks_title`、`tricks_more_link`、`tricks_course_text`、`entry_practice_cta`；改了 `entry_practice_title`、`entry_practice_text`；删掉 `nav_header_puzzles`、`entry_practice_soon`。
- **生成物**：`app/public/og/tricks-{de,en}.png`，由 SKATGO-50 的 `og.mjs` 画。
- **登记表**：`color.stylex.ts` 中 `tileNavy` 的注释从「Practice, coming soon」改为 Tricks 卡片，值没变，也没有新增 token。
- **charter**（grill 第 4 条，人：「我不用确认，你改了就行」）：
  - `product.md`：新增 Skat-Tricks 一段：深入浅出，首篇对准「Skat Tricks」，以后的文章放在下一级地址，练习以后也放进这个模块，每篇都引导去每日赛，文字是自己写的且不推荐书；「What this product is not」的列举补上私人牌桌和 Skat-Tricks。
  - `ui.md`：header 改成五个链接；首页四张卡片；颜色表里补上 `tileNavy` 和 `tileRed`；子页面列表加 Skat-Tricks；新增文章页的版式、三个引导块，以及从牌桌点出去的链接在新标签页打开。
  - `engineering.md`：路由表补上 `/with-friends`、`/table/$id`、`/skat-tricks`；结构表新增 tricks 一行。

## AC results

在构建产物上验证（web 55082，multiplayer 56082，数据库 57082）。Playwright 有头浏览器 `tmp/ac.mjs`，桌面 1280×820 和手机 375×812 各一遍，共 34 项全部 PASS。

1. **导航里的 Tricks** — PASS。
   - 两个视口的 header 里都没有「Aufgaben」，也没有 `data-nav="puzzles"`；手机菜单里也没有。
   - 点「Tricks」到达 `/de/skat-tricks`。
2. **文章** — PASS。
   - h1「Skat Tricks: 12 Tricks, mit denen du sofort besser spielst」，title「Skat Tricks: 12 Tricks für Anfänger und Fortgeschrittene | SkatGo」，h2「Skat Tricks beim Reizen」。
   - 技巧编号 1–12。
   - 3 个引导按钮，逐个点击都到达 `/de/taeglich`。
   - 关闭 JavaScript 时，h1 和 12 条技巧仍在页面里。
3. **收录** — PASS。
   - canonical 是 `https://skatgo.com/de/skat-tricks`，并有 en、de、x-default 三个 alternate。
   - `/en/skat-tricks` 的 h1 是「Skat Tricks: 12 tricks that make you a better player right away」。
   - sitemap 里两个地址都有。
   - `check:seo --built` 通过：44 个可索引页面（之前 42 个）。
4. **站内入口** — PASS，都能到达 `/de/skat-tricks`：
   - 课程页卡片；
   - 页脚；
   - 首页卡片，文字是「Skat-Tricks … Tricks lesen」，首页上已没有「Bald verfügbar」；
   - 牌桌侧栏 → Regeln 里的链接：`target=_blank`，新标签页打开，牌桌还停在 `/de/taeglich/spielen`；
   - 每日赛结算里的「Mehr Skat-Tricks」：同样在新标签页打开。这副牌由 `tmp/stage.mts` 走合法着法推进到只剩最后一张，浏览器只打了这最后一张。

机械防线全部通过：typecheck、build、112 个测试、client bundle、design tokens、literal grep、SSR link、`check:seo --built`、`test:seo` 25/25。multiplayer 没有改动。

## Deviations

- 「Mehr Skat-Tricks」文章列表没有实现。第一篇上线时它本来就为空、不显示，而且以后文章的路由还不存在；加第二篇文章时，连同 `/skat-tricks/<slug>` 路由一起加。
- 引导块按钮在三处都是绿色，依据 grill 第 3 条。

## Environment

- 实际端口：web 55082，multiplayer 56082，数据库 57082。
- 没有新增、修改或删除环境变量；工作目录里的 `.env` 只是指向本单端口的本地值。

## Residual

- 上线后在 Search Console 和 Bing 提交 `/de/skat-tricks`（operations.md 的 SEO 发布步骤）。
