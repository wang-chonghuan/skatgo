# SKATGO-116 handoff

charter 和文档补到 SKATGO-108–115 之后的现状，不改产品行为。

## What changed

- **product.md：**
  - Skat-Tricks 段改写：20 道明牌残局（十二类 36 题隐藏未删）、关卡、全屏牌桌、我方分数对目标（61 / 60）、出错打完再判、可重做、前 2 题免费、第 3 题起登录、答题记录；
  - 「ways in」加上每日赛旁边的按钮。
- **ui.md：**
  - frame 和「The tables」加上题目页；
  - 首页英雄区加上「Skat-Aufgaben lösen」按钮；
  - Tricks 页改为关卡格；
  - 题目页改为全屏牌桌：信息板、左上设置、右上退出、结束时的弹窗、没有锁的登录卡；
  - 子页列表去掉题目页；
  - GameTable 条目加上练习模式。
- **engineering.md：**
  - Tricks 模块那行加上明牌残局的求解和数据、生成器 `--again`、`open-endgame.tsx`、答题记录和 `/api/tricks/ladder/*`；
  - 路由行注明题目页用牌桌框架。
- **multiplayer/README.md：** 阶梯记录一节改成明牌残局，不再用旧名。
- **`tricks-page.tsx`：** 只改头部注释，按 SKATGO-111 写成关卡格。
- **`.gitignore`：** 加 `.DS_Store`。

## AC results

1. **没有过时说法：** 用 grep 查了「36 in all」「No sign-in, nothing saved」「Sieg sichern」、十二张选项卡、白卡题目页等说法，charter 和 README 里都已没有。✅
2. **现状都有记录：** 20 道明牌残局、前 2 题免费、答题记录、关卡、全屏牌桌、出错打完再判、60/61 目标、首页按钮，在相应文件里都能 grep 到。✅
3. **`.DS_Store`：** 合并后主目录 `git status` 不再出现。合并时确认。

## Environment

没有服务，没有 env 变更。
