# SKATGO-12 plan — 接入 Clerk 登录，问答助手须登录后使用

## 代码与 SDK 里已经有的、工单没说的

- `@clerk/tanstack-react-start@1.5.15`：peer 要求 `@tanstack/react-start ^1.167.17`、React `~19.2.3`，本项目为 1.168.46 / ^19.2.8，满足。依赖 `@clerk/backend`、`@clerk/react`、`@clerk/shared`。
- **publishable key 可在运行时注入**：SDK 服务端用 `getEnvVariable('VITE_CLERK_PUBLISHABLE_KEY') || getEnvVariable('CLERK_PUBLISHABLE_KEY')` 取 key，`clerkMiddleware` 把它放进 `clerkInitialState`，`ClerkProvider` 在浏览器端从 SSR 注入的 `window.__clerk_init_state` 读。因此生产只需要运行时环境变量，不需要构建时 `VITE_` 变量，Dockerfile 不改。
- **`/api/ask` 在 TanStack 管线之外**（SKATGO-9 放在 `src/server.ts`、Paraglide 中间件之前），`clerkMiddleware` 与 `auth()` 管不到它。改用同一 SDK 的 `clerkClient().authenticateRequest(request)`（返回 `@clerk/backend` 的 RequestState，`toAuth().userId`），无需新增包。deep-chat 的请求默认 `credentials: 'same-origin'`，会带上 Clerk 的会话 cookie。
- 页面框架 `src/skat-layout.tsx` 的顶栏右侧已有语言切换；手机 480px 以下顶栏已经很挤（品牌 + 三个语言按钮）。
- 助手弹窗 `src/components/skat/ask.tsx` 内的对话区由 deep-chat 渲染，弹窗外壳是课程自己的 StyleX。
- Clerk 的 `SignInButton` / `SignUpButton` 支持 `mode="modal"`，不需要新增路由。

## 路线

1. 装 Clerk CLI，`clerk auth login`（用户在浏览器完成），在 `app/` 执行 `clerk init --app app_3JhPKJFpPIJR7rHWf9A8neRvdFU`；审查它改动的每个文件，把不符合 charter 的部分（颜色字面量、`className`、多余路由等）改回课程的写法。
2. `src/start.ts`：`createStart` + `clerkMiddleware()`；`__root.tsx`：`<ClerkProvider>` 放进 `<body>`，外观用课程 token。
3. 顶栏：未登录只显示「登录」（我们自己的三语文案，`SignInButton mode="modal"` 打开 Clerk 的英文弹窗，注册在弹窗里），已登录显示 `UserButton`。
4. 助手：未登录时弹窗里显示「聊天免费，但需要登录」+ 登录按钮，不渲染 deep-chat；登录后原地出现对话。
5. `lib/ask/handler.ts`：先 `authenticateRequest`（`authorizedParties` 为站点来源），无 userId → 401（三语错误文案）；限流键改为 userId。
6. 测试：handler 的 401 分支；其余照旧。

## 生产

Clerk 生产实例（grill 1）：在 Cloudflare 新增 Clerk 要求的 DNS 记录（用户已批准）；Container App 新增 secret `clerk-secret-key` 与环境变量 `CLERK_SECRET_KEY`（secretRef）、`CLERK_PUBLISHABLE_KEY`（用户已批准）。
