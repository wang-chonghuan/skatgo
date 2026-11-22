# SKATGO-228 AC 检查方案（web 55228，multiplayer 56228，database 57228；有头 Chromium，脚本 tmp/ac.mjs）

1. `/de/skat-online-vergleich` 与 `/en/skat-sites-compared` 返回 200，robots 不是 noindex，两个地址都在 `/sitemap.xml`；`npm run check:seo -- --built` 通过，可收录页面数比 main 多 2。
2. 页面上的对比矩阵有 ≥7 行（≥6 个其他网站或 app + SkatGo）；页面写有核实日期 "22.11.2026"/"22 November 2026"；`app/src/lib/compare.ts` 里关于其他网站的每条事实都带来源网址（命令：数据文件里每个站点的每个事实字段旁有 `source` URL，脚本统计无缺失）。
3. 每个网站有一个带 id 的段落：打开 `<页面>#<站点 id>` 时该段落在视口内（逐站检查）。
4. SkatGo 专区：页面里有 ≥3 张来自 `/compare/*.webp` 的 SkatGo 截图，每张图都加载成功（naturalWidth > 0），并配标题文字。
5. 页面有常见问题一节；HTML 里的 JSON-LD 含 `"@type":"FAQPage"`，问题数与页面上显示的一致。
6. 页面上的 `<img>` 只有 `/compare/` 下的 SkatGo 截图；有商标/无关联说明；页面文字里没有引导去玩真钱的说法（检查不出现 "jetzt um Geld spielen"、"Echtgeld spielen"、"play for money now" 一类号召，且没有指向真钱区的链接）。
7. 1280、375、360 px 下 `scrollWidth <= innerWidth`；360 px 下对比矩阵所在的框可以横向滚动到最后一列（scrollLeft 能到 scrollWidth - clientWidth），第一列在滚动时仍可见。
8. 页脚有链接到对比页，网站其他地方（首页正文、顶部导航、About 页等）没有对比页入口；对比页顶部和底部各有一个醒目的按钮跳到 SkatGo 首页，旁边写明免费、不用注册。
