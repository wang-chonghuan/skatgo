# SKATGO-226 AC 检查方案（web 端口 55226）

1. 德语指对手的说法：playwright 打开德语首页、自由对局页、/de/mit-freunden、/de/ueber-skatgo、课程第 11 课，页面文字和 meta 里不出现 "gegen die KI"、"KI-Gegner"、"(KI)"；出现 "Computer"。英语首页和 /en/play 的 title、description 与 main 上的构建逐字相同。
2. 德语首页：`<meta name="description">` 以 "Ohne Anmeldung und ohne Werbung" 那句开头，含 "Turnier" 和 "Rangliste"；`<title>` 与改动前相同。

（2026-11-22 返工：原第 3–5 条——Skat Palast 对比页——随该页移到新工单，本单只验 1、2 条，以及首页 title 和顶部导航不含 "Skat Palast"。）
