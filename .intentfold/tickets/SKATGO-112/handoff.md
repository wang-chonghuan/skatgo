# SKATGO-112 handoff

明牌残局第 3 题起的登录卡：去掉锁图标，正文后半句改成友好的话。

## What changed

- **登录卡**（`tricks-exercise-page.tsx`）：去掉锁图标，标题和正文直接排在卡片左边。
- **文案（`tricks_ladder_gate_text`）：** 只改后半句，第一句、标题和按钮不变。
  - en：「From here on, sign in for free to play all the puzzles – and pick up where you left off on any device.」
  - de：「Ab hier meldest du dich kostenlos an – dann kannst du alle Aufgaben spielen und auf jedem Gerät da weitermachen, wo du aufgehört hast.」

## AC results

本地构建版 55112，`tmp/ac.mjs`。没登录时打开第 3 题，桌面 1440×789 和手机 375×667 各一遍，德文和英文都查：

1. **锁图标：** 没有。✅
2. **新文案：** 新的后半句在，「keep track / merken wir uns」不在。✅
3. **其余不变：** 标题、第一句和按钮都没变，没有报错。✅

机械防线全部通过：typecheck、build、test 266 项、bundle、tokens、literal grep、SSR import、`check:seo`、`test:seo`。

## Environment

端口 55112，构建版留着运行供审阅。没有 env 变更。
