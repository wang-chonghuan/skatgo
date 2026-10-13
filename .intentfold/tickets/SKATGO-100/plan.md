# SKATGO-100 plan

1. 文案：`de.json`、`en.json`、`legal.ts` 恢复连字符；`entry_lead` 第二句。
2. 信息板（`game-table.tsx` `InfoBoard`）：
   - Hand、Ouvert 放到小字行；
   - `boardValue` 可换行，`boardSub`、`boardLabel` 以省略号结尾，数字不换行；
   - 总分等宽三列，手机上 `infoTotal`，有四位数时 `infoTotalLong`；
   - 手机上格子左右内边距 6px，标签字距 0.02em。
3. 跳叫：`acting` 和顶部消息行在 `remote.busy`（发出的动作等回复中）时都不显示动作按钮。
4. 打牌记录（`daily-comparison.tsx` `TrickReplay`）：点一墩开它的手牌，只开一个，点别处收起。
5. 退出按钮：放在表格网格的牌桌那一格，层级高于弹窗；弹窗上方留出按钮的位置。
6. charter 同步。
