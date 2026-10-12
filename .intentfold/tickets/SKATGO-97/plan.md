# SKATGO-97 plan

## 代码里有、工单没写的
- 定约弹窗（`DeclarePicker`）顶部是 `<Say><Rich text={m.declare_prompt(...)} /></Say>`，消息只在这里用。
- 信息板每格是一列：标签、数字、下面一行，间距 `space.x4`；「Gesamt」格子里每个总分自己是一列，数字和名字间距 `space.x2`。线上实测下面一行比名字低 2px。

## 路线
1. 删掉 `Say` 那行和德英两条 `declare_prompt`。
2. `boardCell` 的间距改为 `space.x2`，`boardLabel` 加 `marginBottom: space.x2`：标签到数字仍 4px，数字到下面一行 2px。

## 检查
整套机械检查；构建产物上量两行的位置（桌面、手机），并用只跟叫的脚本赢下叫牌、打 Hand，看定约弹窗。
