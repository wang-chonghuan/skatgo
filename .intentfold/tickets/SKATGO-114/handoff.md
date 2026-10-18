# SKATGO-114 handoff

产品定位改为「先拿下英文 Skat 老玩家，再扩展」；英文首页对准「Skat card game」，5 分钟上手页对准「how to play skat」。德文页面不变。

## What changed

- **英文首页（`messages/en.json`）：**
  - 网页标题「Free Daily Skat Online – Same Deals for Everyone | SkatGo」→「Skat Card Game – Play Free Online | SkatGo」；
  - 主标题「Free Skat online」→「The Skat card game, free online」；
  - 描述没改，仍讲每日赛、AI、课程。
- **5 分钟上手页（`lib/skat/quickstart.ts` 的 EN）：**
  - 网页标题 →「How to Play Skat: the 12 Rules in 5 Minutes」；
  - 主标题 →「How to play Skat in 5 minutes」；
  - 地址不变。
- **charter product.md：**
  - 「Germany is the primary market … 1%」那段换成 grill 4 定的新定位：英文老玩家首攻、英语爱好者是相邻市场、德国是长期大市场；
  - 判断标准写进去：两周内 30% 在 3 个不同的日子回来，达不到就重新考虑定位；
  - engineering.md 的 URL 结构和 ui.md 的搜索内容规则跟定位无关，没动。

## Grill

grill.md 4 题都按建议（人：「都按建议」）。

## AC results

本地构建版 55114，`tmp/ac.mjs`，桌面和手机都跑：

1. **英文首页：** `/en` 标题「Skat Card Game – Play Free Online | SkatGo」，h1「The Skat card game, free online」。手机上两行。✅
2. **5 分钟上手页：** `/en/course/skat-in-5-minutes` 标题以「How to Play Skat」开头。✅
3. **charter：** product.md 新定位和标准都在，旧说法不在。✅
4. **SEO：** `check:seo -- --built`、`test:seo` 通过。可收录、规范地址、语言版本互标、标题和描述全站唯一。✅

德文首页和德文上手页标题不变。机械防线全部通过（test 266 项）。

## Environment

端口 55114，构建版留着运行供审阅。没有 env 变更。

## Residual

- 外链和社区推广（pagat、BGG、ISPA 等）由人亲自做，不在本单。
- 本单和 SKATGO-113 都改了 product.md，但改的地方不同（第 98 行一带和第 113 行一带）；合并时按顺序 rebase。
