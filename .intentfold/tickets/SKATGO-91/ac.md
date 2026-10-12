# SKATGO-91 acceptance checks

在构建产物上跑（web 55091），Playwright 有头浏览器，桌面 1280×820、手机 375×812。

## AC1 新文案
- 德文首页 `/` 的导语是 „Spiel gegen die KI, mit Freunden oder im Turnier – mit KI-Coach.“；英文首页 `/en` 是 "Play the AI, your friends or the community – with an AI coach."。字符数都不到原来的 60%（德文 64/127，英文 62/112）。

## AC2 字号更小、不加粗
- 导语计算样式：桌面 20px、手机 17px，font-weight 500（原来 28/24px、700）。
- 桌面上导语一行；手机上不超过三行。

## AC3 其他不变、无横向滚动
- 标题的字号、粗细与 main 上一样；绿色按钮、✓ 行都在。
- 桌面和手机上 `document.documentElement.scrollWidth <= innerWidth`。
