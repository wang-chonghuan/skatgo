# SKATGO-81 plan

## 代码里看到的（工单没写）
- **SKATGO-79 之前**，榜单就是按 `daily_entries.total` 排名的，同分时先打完的在前。`total` 这一列一直在写，SKATGO-79 也没删，所以改回来不用迁移数据。
- **Saldo 现在用在这些地方**：
  - multiplayer 的 `dailyBoard`：排序、名次、`me`、`ai`；
  - web 的榜单：排序、显示、表头；
  - 「这是第几名」那句话（`daily_would_be`）；
  - `/daily` 每副一行（`VsAiTable`），以及它的表头；
  - 每副打完后的那一行赛况（`daily_after`）；
  - 记分单（`ScoreSheet`）；
  - 「计分和排名」那段文字（`daily_scoring_text`）。
- **记分单里的 Saldo 一格**用的是最大号字（`dialogTitle`），注释写着「这张表就是为了看它」。改成参考之后，它应该和其他分数一样大小。

## 路线
1. **multiplayer**（`dailyBoard`）：
   - 按 `total` 排名，同分时先打完的在前；`me.rank` 也按 `total` 算；
   - `ai` 改成 `{ total }`：AI 在玩家座位上的整赛总分，也就是 `totals(benchmarks)[PLAYER]`；
   - `BoardRow` 和 `me` 去掉 `saldo`。
2. **类型**：在 `tournament.ts` 里同步修改。
3. **web**：
   - 榜单按 `total` 插入 AI 行，显示总分，表头写「Punkte」；
   - 「这是第几名」那句话用 `me.total`；
   - `VsAiTable` 每行显示你和 AI 的总分，表头写「Punkte」；
   - `daily_after` 用总分；
   - `daily_scoring_text` 写明按 Seeger-Fabian 总分排名。
4. **记分单**：保留 Saldo 一列和它的说明，字号降到和其他分数一样；玩家自己那一列仍有底色。
5. **charter**：product、engineering、ui 改成按总分排名，Saldo 只作参考。
6. **部署顺序**：先 multiplayer，再 web。两次部署之间几分钟，旧网页拿到新接口时 AI 行不显示，榜单显示的数字和排序可能对不上；web 一上线就恢复正常。
