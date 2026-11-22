# SKATGO-226 grill

## 你的决定

（无：两题都采纳了推荐）

## 采纳的推荐


1. **新页面只做德语，还是德英两版？**
   - 背景：站点规定每个页面都有德英两版，`npm run check:seo` 机械检查每个 sitemap 条目覆盖全部语言、alternates 互指。只做德语就要改这条检查，允许"声明为单语言"的页面——这接近 engineering.md Redline 7（不得为通过而削弱检查），需要你明确同意。
   - 推荐：**做德英两版**。英语版对准 "Skat Palast alternative"（海外的德语圈/英语玩家），工作量只是一份翻译；不碰检查规则。
   - 理由：成本低、不动机械防线；工单 Constraints 里的"只做德语"是 agent 起草的指令里写的，不是基于这条限制做的决定。
   - 决定：采纳推荐（人，2026-11-22，"German + English (Recommended)"）

2. **（审批，product.md Redline 1）在 `product.md` 里加一段描述这个新页面？**
   - 推荐：同意。和 About、Skat-Tricks 等页面一样写一段：页面是什么、对准什么搜索、只写核实过的事实、商标说明。
   - 决定：采纳推荐（人，2026-11-22，"Yes, add it (Recommended)"）

## 我替你决定的（agent 决定，验收时可改）

3. 对比怎么写：Skat Palast 也免费，手机 app 也能不建账号直接玩，所以"不用注册"不作为区别。页面如实写对方的长处（真人对手、大社区、联赛和锦标赛），SkatGo 的区别写：随时和电脑打不用等人、每副牌和 AI 在同样的牌上对比、每日锦标赛（大家同样的牌、Seeger-Fabian）、互动课程、不卖任何东西（对方有可选的付费 Premium）。不提广告（未核实对方有没有）。依据：工单 Constraints"核实不了的不写"、UWG §6；文案在验收时给你看。
4. 牌桌和房间座位上的 "{name} (KI)" 改成 "{name} (Computer)"：属于指对手。若 360 px 下名字放不下，再在验收截图里给你看。依据：工单 Scope 1。
5. 保留 "KI" 的地方：个人记录页（和 KI 在同样的牌上比较）、XP 档位（über/unter der KI）、叫牌练习（答案是 KI 的）、赛后对比和 power-up 说明、About 页每日赛说明里"KI 怎么打这些牌"、法律文本。依据：工单 Constraints 第 2 条。
6. 新页面入口：About 页加一行链接；不放页脚和导航。依据：工单 Constraints"首页 title 和顶部导航不出现"；页脚每页都有，太显眼。
7. 新页面地址：`/skat-palast-alternative`（德语地址同名），title "Skat Palast Alternative – Skat gegen den Computer | SkatGo" 之类，验收时给你看。
