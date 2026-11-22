# SKATGO-226 AC 检查方案（web 端口 55226）

1. 德语指对手的说法：playwright 打开德语首页、自由对局页、/de/mit-freunden、/de/ueber-skatgo、课程第 11 课，页面文字和 meta 里不出现 "gegen die KI"、"KI-Gegner"、"(KI)"；出现 "Computer"。英语首页和 /en/play 的 title、description 与 main 上的构建逐字相同。
2. 德语首页：`<meta name="description">` 以"ohne Anmeldung, ohne Werbung"那句开头，含 "Turnier" 和 "Rangliste"；`<title>` 与改动前相同。
3. 新页面：GET 200；`robots` 不是 noindex；在 /sitemap.xml 里；页面上有进入 /de/spielen 的按钮，点了进入自由对局牌桌（不要求登录）；有商标说明；页面上没有对方的图片。`npm run check:seo` 通过。
4. 首页 `<title>` 和顶部导航不含 "Skat Palast"；从 /de/ueber-skatgo 能点到新页。
5. 1280 px 和 360 px 宽度下新页面 `document.documentElement.scrollWidth <= innerWidth`，并截图。
