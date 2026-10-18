# SKATGO-111 handoff

明牌残局改成两步杀、消消乐那样简洁的界面：目录是关卡格，做题页只有一行标题和牌桌，对错和结果都显示在牌桌上。题目、求解和打法树不变（SKATGO-110 的 20 道）。

## What changed

- **目录（`tricks-page.tsx`）：**
  - 明牌残局这一类显示为 20 个方块：做对是绿勾，做错是红叉（角上写答错次数），下一关有绿框，没登录时第 3 关起有锁；
  - 下面一个按钮「Aufgabe n spielen」直达下一关；
  - 逐题的文字标题去掉了；
  - 已隐藏的其他类型保持原来的卡片样式。
- **牌桌（`game-table.tsx`）：**
  - 练习来源可以带四样东西：顶部内容（代替信息栏）、牌的对错标记、发光的牌、结束时浮在牌桌上的内容；
  - 练习模式下不显示出牌提示语和侧边面板（叫牌记录、合约标签）。
- **练习（`open-endgame.tsx`）：**
  - 顶部分数条：防家题显示「Alleinspieler: n · Ziel: unter 61」，庄家题显示「Du: n · Ziel 61」，分数 = 底牌 + 吃墩；
  - 出对的牌标绿，出错的牌标红，那一步能赢的牌在手里发光；
  - 对手把牌打完后，结果卡浮在牌桌上。
- **题目页（`tricks-exercise-page.tsx`）：**
  - 标题是一行「Karo · du bist Alleinspieler / du verteidigst」；
  - 任务段落和下面的结果面板去掉了；
  - 结果卡写「Gelöst! / Nicht gelöst」和一行关键牌（第一步错写「Richtig ist …」，后面某一步错写「Hier gewinnt nur …」），按钮「Nächste Aufgabe」「Warum?」「Noch mal」，「Warum?」点开才显示解释；
  - 页面上方间距收紧（只用现有 token），整张牌桌留在屏幕内。
- **文案：** 新增标题、分数条、结果卡、按钮等德英文案，删掉不再用的「Spiel es zu Ende」。

## AC results

本地构建版 55111，`tmp/ac.mjs`，桌面 1280×820 和手机 375×812 都通过：

1. **关卡格：** 20 个方块，没有逐题标题，第 1 关是下一关，3–20 关上锁，按钮写「Aufgabe 1 spielen」。✅
2. **做题页：** 只有一行标题和牌桌；任务说明、信息栏、侧边面板、叫牌记录都不在了。牌桌底边：桌面 819（屏高 820），手机 797（屏高 812）。✅
3. **反馈：**
   - 第 1 题做对 3 步，每步判 good，结束时牌桌上显示「Gelöst! Schlüsselkarte …」，「Warum?」点开才有解释；
   - 第 2 题第一张出错，判 bad，能赢的牌发光，结束时显示「Nicht gelöst · Richtig ist …」。✅
4. **其余照常：** 目录显示 1 ✓、2 ✗（角上 1），第 2 关为下一关，「1 von 20 gelöst」；第 3 关显示登录卡片；没有控制台报错。✅

机械防线全部通过：typecheck、build、test 266 项、bundle、tokens、literal grep、SSR import、`check:seo`、`test:seo`。没有改 multiplayer。

## Deviations

- 页面上方间距只对明牌残局页收紧，其他页面不变。嵌入牌桌的高度 token（640）没改。

## Environment

端口 55111，构建版留着运行供审阅。没有 env 变更。

## Residual

- **Charter：** ui.md 里写的练习页样式（白卡、题目文字、下面的结果面板）和 Tricks 目录，已与明牌残局现状不符，需要人决定怎么改。
