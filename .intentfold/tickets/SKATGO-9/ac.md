# SKATGO-9 acceptance checks

服务：`(cd app && set -a && source .env && set +a && PORT=55009 node .output/server/index.mjs)`；
脚本：`.intentfold/tickets/SKATGO-9/tmp/ac.mjs`（Playwright chromium，headed），桌面 1280×820，手机 375×812（isMobile, hasTouch）。

## AC1 浮动按钮只在课程页面
- 打开 `/zh`、`/zh/lesson/4`：`[data-testid=ask-launcher]` 可见；打开 `/zh/play`：不存在。
- 点按钮 → `[data-testid=ask-panel]` 可见；点 `[data-testid=ask-close]` → 面板消失。
- 桌面和手机各一次。真 = 三个页面的有无都符合，开关都生效。

## AC2 三语提问得到本页语言的回答
- 对 zh / en / de 各打开 `/<l>/lesson/4`，点开助手，在 deep-chat 的输入框里输入一个与本课相关的问题（各语言一句：中文「什么叫必须跟牌？」；英文 "What does following suit mean?"；德文 "Was heißt Bedienen?"），回车。
- 等到 deep-chat 出现 AI 回复气泡（≤ 40 秒），读其文字。
- 真 = 回复非空、长度 > 20，且语言脚本符合：zh 含汉字；en/de 不含汉字且 de 含至少一个德语特征词（"Farbe"/"Bedien"/"Trumpf"/"muss"/"Karte" 之一）或 en 含 "suit"/"card"/"trump" 之一。回复内容质量不评。

## AC3 刷新即清空
- AC2 中文那次拿到回复后 `page.reload()`，重新打开助手：面板内没有用户气泡和 AI 气泡（deep-chat 消息数为 0；只允许 intro 文案）。
- 真 = 刷新后 `getMessages()` 长度为 0（通过 `onComponentRender` 暴露的元素调用），或 DOM 内无 `.message-bubble`。

## AC4 限流与 key 不外泄
- 用 `fetch` 直接向 `http://localhost:55009/api/ask` 连发 12 个合法请求（同一 IP）：至少 1 个返回 429，且响应体是 JSON、含 `error` 字段。
- 用超过 500 字的问题请求一次：返回 4xx。
- `grep -r` 仓库工作树（排除 node_modules、.env、.output）不含 key 的前 8 位；`.output/` 构建产物同样不含；浏览器发出的 `/api/ask` 请求头和请求体里不含 key（Playwright 监听 request）。
- 真 = 以上全部成立。

## AC5 桌面与手机布局
- 桌面 1280×820：面板完全在视口内（boundingBox 在 0..1280 × 0..820 内），输入框可聚焦、可输入。
- 手机 375×812：同上（0..375 × 0..812），页面无横向滚动（`document.documentElement.scrollWidth <= 375`）。
- 真 = 两个视口都成立。
