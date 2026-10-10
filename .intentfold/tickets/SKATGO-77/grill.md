# SKATGO-77 grill

Grill：human。计划和验收检查见 `plan.md`、`ac.md`。

1. **`/daily` 页面怎么排？**
   - **建议**：标题下面放一个切换「6 Spiele | 12 Spiele」，默认 6。切换下面是所选赛的全部内容：开始或继续按钮、当天牌局列表、结果和昵称、排行榜（今天、昨天）。网址带上所选的赛（`?deals=12`），从牌桌回来还停在同一个赛。
   - **理由**：
     - 每个视图只有一个绿色主按钮，符合 ui.md。
     - 页面不会因为两套牌局列表和两个榜变成两倍长。
     - 6 副默认在前，不会劝退。
   - **代价**：进 12 副赛要先点切换，再点开始，多点一下。
   - **另一种做法**：上面并排两张卡片，每张一个按钮，6 副用绿色、12 副用白色；下面仍用切换来看两个赛的牌局列表和榜。
   - **待定**
2. **名称和标题？**
   - **建议**：
     - 切换和按钮上用德文「6 Spiele」「12 Spiele」，英文「6 deals」「12 deals」。
     - 页面 h1 从「Das tägliche Skat-Turnier: 6 Spiele, eine Rangliste」改为「Das tägliche Skat-Turnier: 6 oder 12 Spiele」，英文「The daily Skat tournament: 6 or 12 deals」。
     - 元描述、页面说明和首页元描述里的副数同样写成「6 oder 12」。
     - 说明里的「每人每天一轮」改成「每个赛每天一轮」。
     - 两张分享预览图重画。
   - **理由**：12 副没有公认的专名，按副数叫最直白；标题要让搜索结果里就能看出有两种长度。
   - **待定**
3. **生产表结构变更（operations.md Redline 5）和上线时的发牌，同意吗？**
   - **建议**：
     - 两张表加 `size` 列，已有行默认为 6；主键改为按「日期 + 赛」和「日期 + 赛 + 玩家」。
     - 由 multiplayer 启动时的迁移自动完成，不删任何数据。
     - 上线顺序照旧：先 multiplayer，再 web。
     - multiplayer 上线后，当天的 12 副赛要发牌约 6 分钟，这段时间 12 副赛显示「正在准备」，6 副赛不受影响。
   - **理由**：同一个人同一天要能有两条记录，不改主键做不到。把赛别编进日期字符串可以绕开改表，但那是给数据造新含义，不建议。
   - **待定**
4. **charter 怎么改？**
   - **建议**：本单里由我起草，你同意后改：
     - product.md 第 17 行「every day the same 6 deals… one entry per player per day」改为两个赛、每个赛每人每天一条；
     - engineering.md 每日赛表结构那句补上「按赛」；
     - operations.md 发牌时间那句补上 12 副的实测时间。
   - **理由**：product.md 由人负责，不经你同意不能改；不改的话 charter 会和产品对不上。
   - **待定**

## 回答
人 2026-10-10 通过 AskUserQuestion 回答，四条都按建议：

1. **切换 6 | 12**：默认 6，切换下面是所选赛的全部内容，网址带 `?deals=12`。
2. **名称和标题按建议**：按钮「6 Spiele / 12 Spiele」，英文「6 deals / 12 deals」；h1「Das tägliche Skat-Turnier: 6 oder 12 Spiele」；元描述和说明同步；两张分享预览图重画。
3. **同意生产表结构变更**（operations.md Redline 5）：加 `size` 列，已有行为 6，主键按「日期+赛」，启动时自动迁移，不删数据；上线时 12 副赛先发牌约 6 分钟。
4. **charter 由我起草、人确认**：product.md 第 17 行，engineering.md 表结构那句，operations.md 发牌时间。
