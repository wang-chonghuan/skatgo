# SKATGO-82 acceptance checks

在构建产物上跑（web 55082），Playwright 有头浏览器，桌面 1280×820 和手机 375×812 各跑一遍，脚本放 `tmp/`。

## AC1 导航里的 Tricks
- 打开 `/de/kurs`：桌面导航和手机菜单里都没有文字「Aufgaben」，也没有 `data-nav="puzzles"`；有一个链接「Tricks」。
- 点它到达 `/de/skat-tricks`。

## AC2 文章
- `/de/skat-tricks` 的 h1 含「Skat Tricks」；`<title>` 含「Skat Tricks」；至少一个 h2 含「Skat Tricks」。
- 技巧编号 1–12 齐全。
- 引导块正好 3 个，各有一个按钮；点任意一个到达 `/de/taeglich`。
- 关闭 JavaScript 时，h1 和 12 条技巧仍在 HTML 里（服务端渲染）。

## AC3 收录
- `/sitemap.xml` 里有 `/de/skat-tricks` 和 `/en/skat-tricks`，各带 hreflang。
- 页面上的 canonical 指向自己，并有 de、en、x-default 三个 alternate。
- `/en/skat-tricks` 返回 200，内容是英文版。
- 构建产物上跑 `npm run check:seo -- --built` 通过。

## AC4 站内入口
都要能点进 `/de/skat-tricks`：
- `/de/kurs` 页上的 Skat-Tricks 卡片；
- 每日赛结算里「差别最大的一墩」下面的「Mehr Skat-Tricks」，牌局由脚本走合法着法打完一副；
- 牌桌侧栏 → Regeln 里的 Skat-Tricks 链接；
- 页脚链接；
- 首页的 Tricks 卡片。
