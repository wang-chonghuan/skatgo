# SKATGO-115 plan

## 代码里看到的

- **分数条：** `open-endgame.tsx` 的 `Board` 只算庄家的分 `have`（底牌 + 庄家吃墩），两种题都用 `have/61` 填充；防家题标签是「Alleinspieler: n · Ziel: unter 61」。
- **两边分数的关系：** 防家一方的分 = 防家吃墩的分（底牌归庄家）。整副牌 120 分，所以「庄家 ≤ 60」等价于「防家 ≥ 60」，判定一致。
- **用到的文案：** `tricks_open_declarer`、`tricks_open_goal_defender` 只在这里用。

## 路线

1. `Board` 按身份算「我方分」：
   - 庄家：底牌 + 庄家吃墩，目标 61；
   - 防家：防家吃墩，目标 60。
   - 条按 我方分/目标 填充；`data-have` 改为我方分，另加 `data-goal`。
2. **文案：** 新增防家的「我方」和「目标 60」两条，删掉不再用的 `tricks_open_declarer`、`tricks_open_goal_defender`：
   - 新增 `tricks_open_side`：「Ihr: {n}」/「Your side: {n}」；
   - 新增 `tricks_open_goal_side`：「Ziel 60」/「Goal 60」。
