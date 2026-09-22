# SKATGO-12 grill（Grill: human，2026-09-23 用户逐条回答）

开工前一批问完。用户在开工指令里已答一条：Clerk 自己的登录窗口**显示英文**，不加多语言包。

1. **线上用哪个 Clerk 实例？** — **生产实例，DNS 由我来改。** 用户选此项即批准在 Cloudflare 的 skatgo.com 区新增 Clerk 要求的记录（operations.md Redline 6）。我先确认有没有 Cloudflare 权限，没有就把要加的记录列给用户。开发实例与生产实例的用户库是分开的，已向用户说明。
2. **顶栏入口怎么放？** — **任何尺寸都只放「登录」一个按钮。** 注册在 Clerk 的登录弹窗里一键可达。工单验收标准第 1 条随之从「登录与注册入口」改为「登录入口」，已改工单并留评论。
3. **登录方式？** — **弹窗**（`mode="modal"`）。不离开当前页、不新增路由。
4. **限流按什么算？** — **按用户**：每个账号每分钟 10 次，全站每天 500 次不变。

## 由此确定的实现取舍（依据 SDK 源码与 charter）

- publishable key 在运行时从 `CLERK_PUBLISHABLE_KEY` 读取，经 SSR 传给浏览器；不用构建时 `VITE_` 变量，Dockerfile 不改。
- `/api/ask` 在 `src/server.ts` 里、TanStack 管线之外，所以服务端鉴权用 `clerkClient().authenticateRequest(request)`（同一 SDK，不新增包），并设 `authorizedParties` 为站点自己的来源，拒绝跨站携带会话。
- 未登录时助手不渲染 deep-chat，只显示提示和登录按钮；deep-chat 仍只在第一次真正要聊天时才加载。
