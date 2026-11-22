# SKATGO-229 AC 检查方案（web 55229；有头 Chromium，脚本 tmp/ac.mjs）

1. 8 个地址（4 品牌 × 德英）200、非 noindex、在 sitemap；`check:seo -- --built` 通过（可收录页面 62 = 54 + 8）。
2. 每页：介绍 > 200 字符；≥4 个问题且 FAQPage 数量一致；对比表 ≥4 行；顶部和底部按钮指向 `/de`/`/en`，写明 kostenlos/free 和 ohne Anmeldung/no sign-up。
3. 任意两页德语正文的 5 词片段重合度 < 35%。
4. 无图片、无外链、无负面词（✗、Echtgeld、Zockerstube 等），有商标说明。
5. 总对比页链到 4 个品牌页，每页链回总对比页；页脚、首页、About、规则页没有品牌页链接。
6. 1280、375、360 px 无横向滚动。
7. 上线后在 GSC 申请收录、在 Bing 提交（cap4 之后记录）。
