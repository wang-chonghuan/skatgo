# SKATGO-228 grill

## 你的决定

- 第 3 题改定（人，2026-11-22，在采纳推荐之后）：「不要影响我app主要页面，这些页面要有明显的跳入skatgo home页面的按钮，并介绍免费免登录玩。这些页面不要充斥到我的skatgo游戏主页里去」——不加页脚链接；对比页上要有醒目的按钮跳到 SkatGo 首页，并介绍免费、免登录就能玩。从 About 页留一条不显眼的链接（About 是说明页，不是游戏页）。
- 随后再改定（人，2026-11-22）：「可以放到footerlink里，据说这样互相内链比较好，但是别在其他地方乱搞入口」——入口只有页脚链接，About 页也不加。

## 采纳的推荐

1. **真钱平台要不要进对比？** 爬取结果：Skatstube（"Zockerstube"，1–10 分/点，18+、身份验证）、Euroskat（真钱是主业务，18+）、Skat-Online（5 € 起玩钱，比赛 20 €，比赛 18+）都有真钱 Skat；三家都没写博彩牌照，自称"Geschicklichkeitsspiele"。
   - 推荐：**收进对比**，只陈述事实（"Echtgeld: ja, ab 18"），不推荐、不链接到真钱区，只链首页（nofollow）。
   - 理由：这三家就是搜索量最大的三个站名之二和第五（skatstube 22,200、euroskat 14,800、skat online 9,900/月）；排除它们就丢了这页的大部分流量来源。不做任何引导，法律风险低。
   - 决定：采纳推荐（人，2026-11-22，"Include, facts only (Recommended)"）
2. **（审批，product.md Redline 1）在 product.md 里加一段描述对比页？**
   - 推荐：同意。
   - 决定：采纳推荐（人，2026-11-22，"Yes, add it (Recommended)"）
3. **页脚加 "Skat-Seiten im Vergleich" 链接？**（`ui.md` 的 Footer 一行写死了页脚链接，加链接要改 charter）
   - 推荐：加。页脚在每个页面上，内部链接最多，最有利于这页的排名；About 页也加一条。
   - 决定：采纳推荐（人，2026-11-22，"Yes, footer + About (Recommended)"）

## 我替你决定的（agent 决定）

4. 收录站点：Skat Palast、Skatstube、Euroskat、Skat Treff（GameDuell）、PlayOK、Skat 123（spiele123.com）、Skat-Online（skat-online.com）、Skat（Isar Interactive，Google Play 搜 "skat" 第一，69,500 条评价）、SkatGo。依据：搜索量（`tmp` 关键词数据）和 `tmp/facts.md`。Skat 123 和 Skat-Online 与搜索词的对应"合理但未证实"，页面上不说"你搜的就是它"。
5. 矩阵的列：对手、不登录可玩、平台、费用、广告、真钱、规则（Kontra/Ramsch）、比赛、学习。未核实的格子写 "keine Angabe"/"not stated"，不写 ✗。依据：工单 Constraints"核实不了的不写"。
6. 用户评论（如"Werbung nervt"）不作为事实写进页面，只用商店标签（"Enthält Werbung"）和网页上能看到的广告脚本（PlayOK 的 AdSense）。
7. 不写"只有 SkatGo 才有"：别家没提到不等于没有。SkatGo 专区只说 SkatGo 做什么、有多少（11 课、150 道叫牌题、20 道明牌残局、Gewinnchancen 和 Kartenzähler、每日同牌锦标赛、每局后和 AI 逐墩对比、浏览器里点一下就开始、无广告、不卖任何东西、德英双语）。
8. 截图：SkatGo 自己的 4 张（Gewinnchancen、叫牌练习讲解、明牌残局、课程），由 `app/scripts/make-compare-shots.mjs` 从本地运行的产品生成；不截别家。
9. 外链：每站官网首页或商店页，`rel="nofollow noopener"`，新标签页打开。
10. 地址 `/skat-online-vergleich`、英文 `/en/skat-sites-compared`；title 对准 "Skat online spielen" 与各站名；评分（商店星级、评价数）照抄并注明日期。
11. 首页 title 和顶部导航不放这页（沿用 SKATGO-226 的做法）。
