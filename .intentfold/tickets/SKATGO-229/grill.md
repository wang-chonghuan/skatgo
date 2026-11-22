# SKATGO-229 grill（Grill: self，人 2026-11-22 授权："Yes, decide yourself"）

## 你的决定
- 同意在 product.md 的对比页段落里补充品牌页（"Yes"）。

## 我替你决定的（agent 决定，依据工单 Request 和讨论）
1. 做哪几家：Skat Palast、Skatstube、Euroskat、Skat-Online（品牌词搜索量最大且资料充足）。Spiele123 不做：资料太少，做出来就是 doorway 页。依据：讨论中"4–5 个，Spiele123 视情况"。
2. 每品牌一个静态路由，而不是一个 `$brand` 参数路由：SEO 检查只接受课程作为参数路由目标，静态路由不用改检查。
3. 地址 `/de/skat-online-vergleich/<brand>`、`/en/skat-sites-compared/<brand>`，品牌段德英相同。
4. 页面结构：返回链接、H1、介绍、按钮、"提供什么"格子、品牌 vs SkatGo 表、FAQ、按钮、返回链接、说明。表只列该品牌有资料的行。
5. 不链出到品牌官网，不放图片（沿用 SKATGO-228）。
6. 内容只用 11-22 的爬取资料，未补爬。
7. 防 doorway：每页正文另写，AC 3 机械检查两页重合度。
