# SKATGO-12 acceptance checks

服务：`(cd app && set -a && source .env && set +a && PORT=55012 node .output/server/index.mjs)`；Playwright chromium headed；桌面 1280×820、手机 375×812。

## AC1 未登录：导航有登录按钮，助手提示登录
- 新浏览器打开 `/zh/lesson/4`：顶栏有「登录」按钮（桌面与手机都只有这一个），点它弹出 Clerk 登录窗口，窗口里可进入注册；点开助手，弹窗文字含「聊天免费，但需要登录」，有登录按钮，没有 deep-chat 输入框。`/en`、`/de` 各看一次提示文案。

## AC2 登录后可聊，退出后回到提示
- 用测试账号登录：顶栏出现用户头像按钮；助手里能提问并得到回答；从头像菜单退出后，助手回到 AC1 的提示状态。

## AC3 服务端强制
- 不带会话 cookie 直接 POST `/api/ask`：401，JSON 含 `error`；带已登录会话的浏览器请求：200 且有回答。

## AC4 课程照常
- 未登录打开 `/zh`、`/zh/lesson/4`、`/zh/play`：页面正常，无登录拦截。
