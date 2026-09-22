# SKATGO-10 acceptance checks

服务：`(cd app && set -a && source .env && set +a && PORT=55010 node .output/server/index.mjs)`；
脚本：`tmp/ac.mjs`（Playwright chromium，headed），桌面 1280×820。

## AC1 等待期间：没有三点气泡，按钮按不动
- 打开 `/zh/lesson/4`，开助手，提一个问题。
- 回答到达之前：shadow DOM 里没有 `.deep-chat-loading-message-bubble`；发送按钮的样子与"可发送"不同（背景是 paperEdge 那一档、`cursor: not-allowed`）。
- 此时在输入框再输入一句并按 Enter：`/api/ask` 的 POST 总数仍为 1。
- 真 = 以上三点都成立。

## AC2 回答到达后按钮恢复
- 同一次会话里等到回答，按钮恢复可发送的样子（brass 底、`cursor: pointer`）。
- 再问一句，能正常得到第二个回答（POST 总数变成 2）。
- 真 = 两点都成立。

## AC3 等待期间输入框仍可用
- 等待期间点输入框、输入文字，文字确实进入输入框（读回内容）。
- 真 = 读回的文字与输入一致。

## AC4 三语与对局页一致
- `/en/lesson/4`、`/de/lesson/4`、`/zh/play` 各开一次助手，各提一个问题，等待期间同样：无三点气泡、按钮呈不可用样子。
- 真 = 三处都成立。（对局页只提问，不打牌。）
