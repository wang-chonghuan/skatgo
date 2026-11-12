# SKATGO-188 rework

## 第 1 轮（4138d97）
人类的要求：「这个工单把bing和index now做干净，然后上线这个工单。别留尾巴。google的也更新一下。都要求索引。外链的 以后再说」

- **Google Search Console**（控制台操作，没有代码改动）：
  - 提交了论坛 sitemap `https://skatgo.com/sitemap-forum.xml`；
  - 按重要程度对没收录的页面申请索引，当天被接受的有：英文论坛文章 3/4/5/6、德文论坛文章 3/4、`/en/skat-tricks`、`/de/skat-tricks`、`/en/forum`、`/de/forum`；
  - 第 11 个起 Google 回答 “Quota exceeded”。剩下 10 个（`/de/forum/5…`、`/de/forum/6…`、`/en/with-friends`、`/de/mit-freunden`、`/en/forum/1…`、`/de/forum/1…`、`/en/privacy`、`/de/datenschutz`、`/en/terms`、`/de/nutzungsbedingungen`）次日额度恢复后申请。
- **operations.md**：「Search consoles」改为两个 sitemap 都已提交给 Google 和 Bing（2026-11-12）。
- **复查**：只改了章程文字，没有重跑 AC；cap4 在最终分支上跑了一次机械检查，全部通过。

## 相对冻结的 handoff 的净变化
代码没有变化；章程多记了一行：论坛 sitemap 也提交给了 Google。
