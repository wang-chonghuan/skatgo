# SKATGO-12 rework — 交付后（handoff 冻结于 0b0ef6c）

用户在交付后说：「暂时不换key，你把所有东西都弄好上线，除非你绝对没发弄的，你可以问我，否则你全权负责」。据此做了下面两件事，外加一件按红线不能做、留给用户的事。

## 1. 生产实例关掉 Google 登录（Clerk 配置，不在仓库里）

生产实例的 `connection_oauth_google` 处于开启状态，但 `client_id` 和 `client_secret` 都是空的：上线后弹窗里的「Continue with Google」会是一个点了就失败的按钮。我没法替用户在 Google Cloud 建 OAuth 客户端（要用用户自己的 Google 账号），所以先关掉：

```bash
clerk config patch --app app_3JhPKJFpPIJR7rHWf9A8neRvdFU --instance ins_3JhhbSlXDnOOpj1GJJg4eh6972K --json '{"connection_oauth_google":{"enabled":false}}' --yes
```

先 `--dry-run` 核对只改这一项，再应用；随后重新拉取配置，确认 `enabled: false`。关闭前先确认邮箱登录（`auth_email.used_for_sign_in`）与密码（`auth_password.enabled`）在生产都是开着的，关掉 Google 后仍然有登录方式。开发实例没动，本地仍用 Clerk 的共享凭据走 Google。以后配好凭据，把同一项改回 `true` 即可。

## 2. charter 与现状对齐

只写现在已经存在的事实，不添新规矩：

- `engineering.md`：Stack 里删掉「no API, no server function」，写明唯一的服务端入口 `POST /api/ask`（在 `server.ts`、页面路由之前）以及它要求登录；账号由 Clerk 管，用户存在 Clerk；课程库里补上 `deep-chat-react`。Structure 表补 `lib/ask/`、`start.ts`，并注明 `skat-layout.tsx` 里有登录按钮和助手。
- `ui.md`：在「Where components live」里写明两个第三方组件——deep-chat 与 Clerk——各自带标记和样式，经用户批准；课程能控制的是交给它们的配色（只用 token，在 `ask.tsx` 与 `lib/clerk-appearance.ts`）和外壳（课程 kit）；Clerk 窗口保持英文。
- `operations.md`：
  - Runtime：写明 `web` 里有 `/api/ask`。
  - DNS：补上 Clerk 的 5 条仅 DNS 的 CNAME。
  - 新增 Accounts 条目（应用与生产实例 ID，邮箱+密码，Google 关闭的原因）和助手模型条目。
  - Acceptance：原「No accounts」改为：未登录的新浏览器仍是默认；需要登录的验收用开发实例、`clerk users create` 建号、`+clerk_test` 地址收固定码 424242；生产账号是生产数据（引用既有 Redline 2）。
  - Environment：原「None locally: no `.env`, no keys」改为本地 `app/.env` 需要的四个键及启动时加载 `.env` 的命令；生产的 secret 与环境变量名单补全。
  - Build 段里启动构建版服务的命令同步加上加载 `.env`。

改之前核实了两点：`npm run dev` 与构建版服务都能从 `.env` 读到 Clerk 的 key——未登录请求返回 401 而不是 500。

## 3. 没有做：`product.md`

`product.md` 的 Redline 2 写着「Editing this file — forbidden outright. Product intent is the human's exclusively」。「It is only the course」一句与现在的账号、助手不符，但这属于一律禁止的一条，用户的全权授权也不能越过，留给用户本人改。

## 复验

charter 只是文字，不影响代码；按 cap4 仍在最终分支上跑了一次机械防线。生产配置的改动由部署后在 skatgo.com 实测确认。
