# SKATGO-11 acceptance checks

服务：`(cd app && set -a && source .env && set +a && PORT=55011 node .output/server/index.mjs)`；
脚本：`tmp/ac.mjs`（Playwright chromium，headed），桌面 1280×820。

## AC1 等待期间：聊天区有三个点，按钮上没有
- 打开 `/zh/lesson/4`，开助手，提一个问题，在回答到达前读 shadow DOM：
  - `.deep-chat-loading-message-bubble` 存在；
  - 该气泡左右两侧到点的距离相等（±1px）；
  - 发送按钮里没有 `.loading-submit-button`，有 `svg`；
  - 按钮背景与可发送时不同，`cursor: not-allowed`。
- 真 = 四点都成立。

## AC2 回答到达后按钮恢复
- 等到回答，按钮恢复 brass 底、`cursor: pointer`；再问一句能得到第二个回答。
- 真 = 两点都成立。

## AC3 三语与对局页一致
- `/en/lesson/4`、`/de/lesson/4`、`/zh/play` 各提一个问题，等待期间同样：气泡在、按钮里无三点、按钮呈不可用。
- 真 = 三处都成立。（对局页只提问，不打牌。）
