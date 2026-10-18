# SKATGO-115 handoff

明牌残局的分数条一律显示学员自己一方的分和这一方要达到的分。庄家题不变：「Du: n · Ziel 61」。防家题从「Alleinspieler: n · Ziel: unter 61」改为「Ihr: n · Ziel 60」，n 是防家吃墩的分。

## What changed

- **`open-endgame.tsx` 的 `Board`：** 按身份算我方分和目标，条按 我方分/目标 填充；`data-have` 为我方分，另加 `data-goal`。
  - 庄家：底牌 + 庄家吃墩，目标 61；
  - 防家：防家吃墩，目标 60。整副 120 分，庄家最多 60 分就输，所以和原来的判定完全一致。
- **文案：**
  - 新增 `tricks_open_side`：「Ihr: {n}」/「Your side: {n}」；
  - 新增 `tricks_open_goal_side`：「Ziel 60」/「Goal 60」；
  - 删掉不再用的 `tricks_open_declarer`、`tricks_open_goal_defender`。

## Grill

self，见 grill.md：人的要求对，照做；防家标签用「Ihr」。

## AC results

本地构建版 55115，`tmp/ac.mjs`：

1. **庄家题（第 1 题）：** 「DU: 34 · ZIEL 61」，目标 61；打对后 62 ≥ 61。✅
2. **防家题（第 2 题）：** 「IHR: 35 · ZIEL 60」，目标 60；没有「Alleinspieler / unter 61」。✅
3. **结果一致：** 第 2 题打对 → Gelöst，防家 60；第一张出错后打完 → Nicht gelöst，防家 47。没有报错。✅

机械防线全部通过：test 267 项，`check:seo`、`test:seo`。

## Environment

端口 55115。没有 env 变更，没有改 multiplayer。
