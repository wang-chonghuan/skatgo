# SKATGO-50 plan

## What the code already promises, and what the ticket does not say

- 规则页（`rules-page.tsx` + `lib/skat/rules/content.{de,en}.ts`）已经由引擎渲染四张表（牌点、基础值、Null 值、叫价阶梯）。八个小节各有锚点，但 Grand、Null ouvert、Ramsch 都没有自己的锚点：
  - Grand 是「Spielarten」里的一段；
  - Null ouvert 分在「Spielarten」（数值表）和「Hand … Ouvert」两处；
  - Ramsch 是「Hausregeln」里的一段。
- 规则页「Abrechnung」里写着「SkatGo wertet nicht nach Seeger-Fabian」。自 SKATGO-35 起每日赛按 Seeger-Fabian 计分，这句已经不真实。
- 叫价阶梯 `BID_LADDER`（`value.ts`）里，倍数上限 18（花色）和 11（Grand）是写死在循环里的数字。叫牌表要用同样的上限，所以要把它们导出成常量，不能抄第二份。
- 页面路由由 Paraglide 的 `urlPatterns`（`paraglide.options.ts`）决定。sitemap 的 `PAGES`（`lib/sitemap.ts`）由 `sitemap.test.ts` 对照路由树。
- `check:seo` 会自动发现新的静态路由，并要求：
  - 标题和描述不重复；
  - 只有一个可见 h1；
  - 至少两个上下文内链。
- 每页的预览图 `public/og/<image>-<locale>.png` 按页面 h1 生成，生成脚本是 SKATGO-29 的 `og.mjs`。h1 改了，预览图也要重新生成。
- 主题注册表里没有打印用的媒体查询。只给打印用的样式要新增 `bp.print`，这属于 ui.md Redline 1，需要人批准。
- 打牌页服务端正文（`game-reading.tsx`，文案在 messages 的 `play_about_*`）已经写了「kostenlos und ohne Anmeldung」和「kein Download」，还没写「无广告」「无需注册」。代码里没有任何广告。

## Route

1. **引擎**：`value.ts` 导出倍数上限常量，`BID_LADDER` 改用这个常量。阶梯数值不变，由现有单元测试验证。
2. **叫牌表页**：
   - 新路由 `routes/rules.bidding-table.tsx`，加入 Paraglide 的路由映射，并加进 sitemap 的 `PAGES`；
   - 新组件 `components/skat/bidding-table-page.tsx`，通过 `client-page.tsx` 接入，在服务端渲染；
   - 内容依次为：h1、导语、算法说明（例子的数字从引擎算）、倍数 × 定约矩阵、Null 四个值、完整阶梯；
   - 页尾链接到规则页的 Reizen 小节、第 7 课和牌桌；
   - 打印时只留标题和表格。
3. **规则页**：
   - 改 title、description、h1 和导语；
   - 加 Grand、Null ouvert、Ramsch 三个子标题（h3，带固定锚点），目录里也列出来；
   - Reizen 小节加一个到叫牌表的链接；
   - 改正关于 Seeger-Fabian 的那句。
4. **课程页**：改 title、description、h1 和导语。
5. **打牌页**：改 title、description、h1 和服务端正文。
6. **打印**：经批准后新增 `bp.print`。打印时顶栏、页脚和助手按钮隐藏，叫牌表页上的正文和链接也隐藏。
7. **预览图**：为新页面生成预览图；规则页、课程页、打牌页的 h1 改了，预览图一起重新生成。
8. **charter 偏差只报告、不改**：
   - engineering.md 的路由列表缺新路由；
   - ui.md 缺新的 bp 键。

## Redline lookup

- ui.md Redline 1：新增 `bp.print`，需要人批准。已列入 grill 第 3 题。
- ui.md Redline 2、3：不涉及（只用 StyleX 和 token，不写裸值）。
- ui.md Redline 4：不涉及（首页 hero 不动）。
- engineering.md、operations.md 的 Redlines：为空。
- product.md：不涉及（不新增产品范围，叫牌表是规则参考的一部分）。
- 不加依赖。

## Grill 结论并入

- 第 7 题：打牌页德文 title 用「Skat kostenlos spielen – ohne Anmeldung, ohne Werbung | SkatGo」（约 60 字以内）；「gegen den Computer」放进 h1 和描述。英文同理。
- 第 5 题：Ramsch 的 Jungfrau、Durchmarsch、Schieben 写成常见玩法、各地不同，并写明 SkatGo 不玩 Ramsch。
- 第 3 题：`bp.print` 由人批准（2026-10-06 的工单评论有记录）。
