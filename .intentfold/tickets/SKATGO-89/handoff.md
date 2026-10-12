# SKATGO-89 handoff

## What changed

- **内容**（`app/src/lib/skat/quickstart.ts`）：
  - 人说的十二条，逐条直译成德语和英语，不增不减，没有加解释。用的是德国 Skat 的说法（Stich、Trumpf、Alleinspieler、Gegenspieler、Buben、bedienen），牌名按 app 的写法用 A、10、K、D、B；
  - 第 6、8、10、12 条带一个配图标记；
  - 另有页面标题、一句引导语、meta 信息、底部一句话和两个链接的文字。
- **页面**（`app/src/components/skat/quick-start-page.tsx`）：
  - 阅读栏宽度，十二条按编号排列；
  - 有标记的几条下面配一行牌（`CardRowView`），牌和顺序全部由规则引擎算出：分值取 `POINTS`；同花色和 Null 的顺序取 `strength`；四张 B 取 `trumpSequence`。第 6 条每张牌下面标上分值；
  - 底部是 `tip` 面板，里面的绿色「Jetzt spielen / Play now」按钮去自由对局；再下面是课程和规则两个链接。
- **路由和地址**：
  - 新增 `routes/course.quick-start.tsx`，带 `pageHead`，有 WebPage 和面包屑的 JSON-LD，分享图用 `quick-start`；
  - `paraglide.options.ts` 里加了 `/course/quick-start` → `/de/kurs/skat-in-5-minuten`、`/en/course/skat-in-5-minutes`，写在各节课的 `/course/:slug` 前面；
  - `client-page.tsx` 里登记了这一页；`sitemap.ts` 的 `PAGES` 里加上了它；
  - `routeTree.gen.ts` 是构建时自动生成的。
- **分享预览图**：用 `.intentfold/tickets/SKATGO-50/og.mjs` 从页面的 h1 生成了 `app/public/og/quick-start-{de,en}.png`。
- **入口**：
  - 课程页：简介下面、学习进度卡片上面，一张和课程卡片一样的白色卡片（`skat-quick-card`）；
  - 首页「Neu beim Skat?」那块：按钮旁边一行带下划线的小字链接（`entry-quick`），只在还没学过任何一课时显示（服务器渲染时也显示）；学过的人在那里仍然看到「已完成 n 课」；
  - 规则页：简介下面一行链接（`rules-quick`）；
  - 顶部导航没有改动。
- **文案**（de/en）：新增 `quick_course_text`、`quick_entry_link`、`quick_rules_link`。
- **charter**：
  - engineering.md：路由和文件职责；
  - ui.md：这一页的样子和三个入口；
  - product.md：在课程那段补了一句。

## AC results

在构建产物上验证：web 55089（静态页，不需要 multiplayer）。浏览器检查用 Playwright 有头浏览器跑 `tmp/ac89.mjs`，桌面 1280×820 和手机 375×812、德语和英语各一遍。

1. **十二条完整** — PASS。
   - 两种语言都是编号 1–12，顺序不变，每条显示的文字等于内容文件里的那一条；
   - 译文已逐条对照人的中文原文，没有增减。
2. **牌面配图和引擎一致** — PASS。和按 Skat 规则手写的期望顺序比对，四行全部一致：
   - 第 6 条：♥A ♥10 ♥K ♥D ♥B，下面标 11 10 4 3 2；
   - 第 8 条：♠A 10 K D 9 8 7；
   - 第 10 条：♣B ♠B ♥B ♦B；
   - 第 12 条：♥A K D B 10 9 8 7。
3. **三个入口** — PASS（两个视口，两种语言）。
   - 首页小链接、课程页卡片、规则页链接，点进去都到 `/de/kurs/skat-in-5-minuten`（德语）或 `/en/course/skat-in-5-minutes`（英语），页面标题正确；
   - 课程页的卡片在学习进度卡片上面；
   - 顶部导航仍是 5 个链接。
   - 第一次跑时这一项报了失败，原因在脚本：客户端跳转时地址先变，页面还没画出来脚本就去读标题了。改成等页面出现再读，之后全部通过。
4. **开始打牌和 SEO** — PASS。
   - 绿色按钮进入 `/de/spielen` 或 `/en/play`；
   - 不跑 JavaScript，直接抓服务器返回的 HTML，两种语言的十二条文字都在；
   - `check:seo --built` 现在算 46 个可索引页面（多出的是这一页的德语和英语），全部通过。

机械检查全部通过：typecheck、build、115 个测试（其中 `sitemap.test.ts` 核对了 `PAGES` 和路由树）、client bundle、design tokens（131 个文件）、literal grep、SSR link、`check:seo --built`（46 个可索引页面、6 个 noindex）、`test:seo`。

## Deviations

- 无。路线按 plan.md 和 grill 的决定做的。

## Environment

- 实际端口：web 55089，没有启动 multiplayer 和数据库。
- 没有新增、修改或删除环境变量。

## Residual

- **请人确认**：product.md 的红线 1 要求改动前人明确批准。这次补的那句（课程那段下面）依据的是人在 SKATGO-79 关单时的授权「授权你改所有charter，移除不一致和矛盾的地方，写上最新的」。如果人不同意，合并前删掉那一句即可。
- **手机上的配图会折行**：第 6 条 5 张牌排成 4+1，第 8 条 7 张排成 4+3，第 12 条 8 张排成 4+4。这是课程里通用的牌行组件的现有行为，读起来没问题。要排成一行，就得改这个共享组件的牌面大小，这次没有动。
- **上线**：只有 web 有改动，部署 web 即可。
