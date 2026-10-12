# SKATGO-97 acceptance checks

构建产物 web 55097、multiplayer 56097，Playwright 有头浏览器，桌面 1280×820、手机 375×812（`tmp/ac.mjs`）。

## AC1 定约弹窗没有说明句
- 只跟叫赢下叫牌、选 Hand，定约弹窗里没有「Sag dein Spiel an… / Du hast bis … gereizt」。

## AC2 下面一行对齐
- 信息板上「Spiel n von 6」与「Lina / Du / Noah」的上边位置相差不超过 0.5px；名字的位置与线上（改动前）相同。

## AC3 「Ändern」是绿色
- 打完今天 6 副赛的设备（`tmp/finish.mts`，脚本合法着法），`/de/taeglich` 上名字旁的「Ändern」背景是绿色按钮的颜色 rgb(0, 163, 54)，桌面和手机。
