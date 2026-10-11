# SKATGO-82 grill

Grill：human。计划和验收检查见 `plan.md`、`ac.md`。开发开始时人已经定了三点：首页卡片改名改文案；文章深入浅出；不写书的推荐。

1. **首页卡片的名字和文案？**
   - **建议**：
     - 德文：标题「Skat-Tricks」；文案「Zwölf Tricks fürs Reizen, Alleinspiel und Gegenspiel – einfach erklärt, sofort im Turnier ausprobiert.」；按钮「Tricks lesen」。
     - 英文：「Skat tricks」；「Twelve tricks for bidding, playing alone and defending – explained simply, tried out in the tournament right away.」；按钮「Read the tricks」。
     - 卡片的颜色和插画不变。
   - **理由**：以后这里也会放练习，所以文案不写「练习」，也不写「即将推出」。
   - **待定**
2. **从牌桌里点出去的两个链接，要不要在新标签页打开？** 指侧栏规则页里的 Skat-Tricks 链接，以及结算里的「Mehr Skat-Tricks」。
   - **建议**：
     - 新标签页打开。
     - 「Mehr Skat-Tricks」出现在所有显示「差别最大的一墩」的地方：每日赛结算、`/daily` 的每一行、自由对局的结果。
   - **理由**：
     - 自由对局的状态只在当前页面里，离开就丢了这局；新标签页打开，牌局保持不动。
     - 三处用的是同一块，放在一起最一致。
   - **待定**
3. **文章的三个引导块都用绿色主按钮吗？**
   - **建议**：都用绿色，都去每日赛。
   - **理由**：ui.md「每个视图最多一个绿色按钮」防的是几个不同的主操作互相抢；这三个是同一个操作，分布在长文章的开头、中间和结尾，一屏里最多只看到一个。
   - **另一种做法**：只有开头一个绿色，其余两个白色。
   - **待定**
4. **charter 怎么改？**
   - **建议**：本单里由我起草，你同意后改：
     - product.md：「What this product is」加一段 Tricks 模块（文章，以后还有练习）；「What this product is not」的列举补上 Tricks 和私人牌桌。
     - ui.md：header 链接改成现在的五个（每日赛、学习、自由对局、私人牌桌、Tricks）；首页卡片；文章页的版式和引导块。
     - engineering.md：路由表加 `/skat-tricks`；结构表加 `lib/skat/tricks/` 和 `tricks-page.tsx`。
   - **理由**：product.md 不经你同意不能改；ui.md 的「四个链接」已经和代码对不上，这次正好一起改对。
   - **待定**

## 回答
人 2026-10-12 通过 AskUserQuestion 回答：

1. **首页卡片按建议**：「Skat-Tricks」，文案和按钮如上，颜色和插画不变。
2. **从牌桌里点出去的两个链接，在新标签页打开**；「Mehr Skat-Tricks」出现在所有显示「差别最大的一墩」的地方。
3. **三个引导块都用绿色主按钮。**
4. **charter**：人说「我不用确认，你改了就行」。也就是说人明确同意本单直接修改 product.md、ui.md、engineering.md，不再另行确认。
