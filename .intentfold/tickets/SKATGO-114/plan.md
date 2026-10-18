# SKATGO-114 plan

## 代码里看到的（工单没写）

- **英文首页：**
  - 网页标题 `home_meta_title`：「Free Daily Skat Online – Same Deals for Everyone | SkatGo」；
  - 主标题 `entry_title`：「Free Skat online」；
  - 描述 `home_meta_description` 已经讲了 AI 对手、每日赛、课程、免下载。
- **5 分钟上手页：**
  - 标题和 h1 在 `lib/skat/quickstart.ts` 的 EN 对象里，不在 messages 中；
  - 现在的网页标题「Skat in 5 minutes: the 12 rules to start playing」，h1「Skat in 5 minutes」。
- **SEO 检查：** 要求全站标题和描述唯一。课程目录页标题「Learn to Play Skat – Free Course for Beginners | SkatGo」，两页不会撞。
- **charter：** product.md 第 98–100 行写着德国是主要市场、英文约 1%（SKATGO-44）。第 113 行「German homepage is the same for every browser」属于 SKATGO-113，本单不动，避免两单改同一行。

## 路线

1. **英文首页：** 改 `home_meta_title` 和 `entry_title` 的英文值，用词见 grill 1、2。德文不动。
2. **5 分钟上手页：** 改 `quickstart.ts` 里 EN 的 `metaTitle`（和 grill 3 决定的 `h1`）。德文不动。
3. **charter：** 改写 product.md 的市场定位段，草稿见 grill 4。其他只因「德国优先」写的表述：
   - engineering.md 的「German-first public addresses」讲的是 URL 结构，工单说不动；
   - ui.md 的 SKATGO-44 那条讲的是搜索内容不能隐藏，和市场无关，也不动。
4. **检查：** `check:seo -- --built` 和 `test:seo`，再用 Playwright 读两页的标题。
