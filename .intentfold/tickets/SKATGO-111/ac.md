# SKATGO-111 ac

`tmp/ac.mjs` 用 Playwright 在本地构建版（55111）上跑，桌面 1280×820 和手机 375×812 各一遍：

1. **关卡格：** 20 个方块，没有逐题标题；状态正确（勾、叉、下一关、锁），答错次数在角上；「Aufgabe n spielen」按钮直达下一关。
2. **做题页：** 一行标题加带分数条的牌桌；没有任务说明（`tricks-open-task`）、信息栏（`skat-info`）、侧边面板（`skat-panel`）和叫牌记录（`skat-history`）；牌桌底边不超出屏幕。
3. **反馈：**
   - 出对的牌判 good；
   - 出错的牌判 bad，能赢的牌发光；
   - 结束时牌桌上显示小卡（Gelöst / Nicht gelöst、关键牌或「Richtig ist」、下一关、Warum?、Noch mal）；
   - 「Warum?」点开前不显示解释。
4. **其余照常：** 第 3 关起要登录，没有控制台报错。
