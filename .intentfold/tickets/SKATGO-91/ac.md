# SKATGO-91 acceptance checks

在构建产物上跑（web 55091），Playwright 有头浏览器，桌面 1280×820、手机 375×812。

## AC1 新文案
- 德文首页 `/` 的导语是 „Spiel gegen die KI, mit Freunden oder im Turnier. Nach jedem Spiel vergleichst du dich mit der KI: Wer hat besser gespielt?“；英文首页 `/en` 是 "Play the AI, your friends or the tournament. After every deal, compare yourself with the AI: who played it better?"。不含连字符或破折号。

## AC2 字号更小
- 导语计算样式：桌面 22px、手机 18px，font-weight 700（原来 28/24px、700，只缩小字号）。
- 桌面上不超过两行；手机上不超过四行。

## AC3 其他不变、无横向滚动
- 标题的字号、粗细与 main 上一样；绿色按钮、✓ 行都在。
- 桌面和手机上 `document.documentElement.scrollWidth <= innerWidth`。
