# SKATGO-12 handoff — 接入 Clerk 登录，问答助手须登录后使用

首次交付基线。cap3 自主开发，grill 由用户逐条回答（见 grill.md）。Finish: review——本地服务留着等用户过目，合并与部署等用户点头。

## What changed

**接入方式**：按用户给的 Clerk 指南，`clerk auth login`（用户本人完成）→ `clerk init --app app_3JhPKJFpPIJR7rHWf9A8neRvdFU`。`clerk init` 安装了 `@clerk/tanstack-react-start@^1.5.15`、生成 `src/start.ts`、给 `__root.tsx` 加了 `ClerkProvider`，另生成了 `/sign-in`、`/sign-up` 两个页面路由和对应的 `VITE_CLERK_SIGN_*` 环境变量。其后逐个审查：

- **两个登录页路由删掉**：grill 定了用弹窗；而且它们用 `style={{…}}`，违反 ui.md Redline 3。对应的四个 `VITE_CLERK_SIGN_*` 变量一并从本地 `.env` 删除。
- **`src/start.ts`**：改写成项目风格（单引号、无分号、带说明）；内容就是 `createStart` + `clerkMiddleware()`。
- **`src/routes/__root.tsx`**：`clerk init` 把格式弄乱了（多余括号、分号、文件末尾缺换行），还原后手工加 `<ClerkProvider appearance={clerkAppearance}>`，放在 `<body>` 里、包住 Astryx 的 `<Theme>`，`<Scripts />` 留在外面（与官方示例一致）。
- **publishable key 改为运行时读取**：本地 `.env` 里的 `VITE_CLERK_PUBLISHABLE_KEY` 改名为 `CLERK_PUBLISHABLE_KEY`。SDK 在服务端读它，再经 SSR 交给浏览器，所以构建不依赖它，Dockerfile 不改，本地与生产走同一条路。
- `src/routeTree.gen.ts`：生成器把 `src/start.ts` 登记进类型（`config: … startInstance.getOptions`），属于正常重新生成。

**新增 / 改动**：

- `src/lib/clerk-appearance.ts`（新）：Clerk 窗口的配色全部取自 `skat.*` token（brass / paper / ink / paperEdge / bad），无颜色字面量；实测 CSS 变量生效。
- `src/skat-layout.tsx`：顶栏右侧在语言切换旁加 `Account`——未登录是一个「登录」按钮（课程 `Btn tone="felt" size="sm"`，`SignInButton mode="modal"`），已登录是 Clerk 的 `UserButton`。桌面与手机都只有这一个按钮（grill 2）。
- `src/components/skat/ask.tsx`：弹窗内未登录显示「聊天免费，但需要登录。」和登录按钮，**不加载 deep-chat**；登录后原地出现对话。对话的归属键由「页面」改为「账号 + 页面」：退出后另一个人在同一个标签页登录，看不到前一个人的对话。
- `src/lib/ask/handler.ts`：先验会话，再做别的。
  - 用同一个 SDK 的 `clerkClient().authenticateRequest()`，未登录返回 401 与三语文案。
  - Clerk 会复制传给它的请求，而请求体已被本处理函数读过，复制就会失败（首轮 500 的原因）。所以只把 URL 和请求头交给它。
  - `authorizedParties` 为站点本身。只有当请求确实打到本机（localhost）时，才额外放行本机页面。判断依据是请求的主机名，而不是 `NODE_ENV`：构建会把后者编译成常量 `"production"`，本地登录后就被拒了（首轮 401 的原因）。Clerk 生产实例不会给 localhost 页面签发令牌，因此线上等于只放行 skatgo.com。
- `src/lib/ask/limits.ts`：限流键由 IP 改为账号（grill 4），数字不变；对应测试同步改名。
- 三语文案：`auth_sign_in`、`ask_login_required`、`ask_sign_in_required`。

## AC results（`tmp/ac.mjs`，Playwright headed，已构建服务 :55012，Clerk 开发实例；20/20）

1. **未登录** — PASS：桌面与手机顶栏都只有一个「登录」，无横向滚动；点开是 Clerk 窗口，内有 Sign up；助手显示「聊天免费，但需要登录。」和登录按钮，无 deep-chat。en / de 的提示与按钮文案跟页面语言走。无页面错误。
2. **登录后** — PASS：顶栏出现头像按钮；提问得到中文回答；从头像菜单退出后，助手回到提示、无对话框。
3. **服务端强制** — PASS：不带会话直接 POST，返回 401 `{"error":"Bitte melde dich an, um zu fragen."}`；登录后浏览器发出的请求 200。
4. **课程照常** — PASS：未登录打开 `/zh`、`/zh/lesson/4`、`/zh/play` 均 200、不被引去登录，对局桌与课程正常显示。

验收账号是用 `clerk users create` 在**开发实例**里建的 `skatgo-ac+clerk_test@example.com`，密码只存在不入库的 `tmp/test-user.pw`。Clerk 的「新设备」邮箱验证对 `+clerk_test` 地址接受固定码 424242，这是它给开发实例准备的测试方式。浏览器里的注册流程在 Continue 上停住（疑为机器人防护），没有去绕，改用 CLI 建号。

机械防线通过（typecheck、build、62 个测试、客户端包检查 12 个 chunk 无服务端引用、样式 grep = 1、SSR 链接）。

## Deviations from plan.md

- 多了两处计划里没有的修正：请求只交 URL 和头给 Clerk；`authorizedParties` 按请求主机判断而非 `NODE_ENV`。
- `clerk init` 生成的两个路由与四个变量被撤掉，理由见上。

## Environment

- 端口：web **55012**（本机仍在跑：http://localhost:55012/zh/lesson/4 ，开发实例）。
- env 键新增：`CLERK_PUBLISHABLE_KEY`、`CLERK_SECRET_KEY`。本地为开发实例的 key，cap4 时同步到主检出的 `app/.env`；生产为 live key，已配置（见下）。

## 生产已备好（用户已批准：operations.md Redline 5、6）

- 用户本人用 `clerk deploy` 建了 Clerk 生产实例 `ins_3JhhbSlXDnOOpj1GJJg4eh6972K`，域名 skatgo.com。
- Cloudflare 的 skatgo.com 区新增 5 条 CNAME，全部为仅 DNS（不代理），备注「Clerk production (SKATGO-12)」：
  - `clerk` → `frontend-api.clerk.services`
  - `accounts` → `accounts.clerk.services`
  - `clkmail` → `mail.osp4jwnahfld.clerk.services`
  - `clk._domainkey` → `dkim1.osp4jwnahfld.clerk.services`
  - `clk2._domainkey` → `dkim2.osp4jwnahfld.clerk.services`

  原有的根域 A、www、asuid 未动。
- 生产 key 用 `clerk env pull` 直接从 Clerk 拉取（publishable key 与用户在对话中给出的一致），没有经手用户贴的文本。
- Container App `ca-skatgo` 新增 secret `clerk-secret-key`，以及环境变量 `CLERK_SECRET_KEY`（引用该 secret）和 `CLERK_PUBLISHABLE_KEY`；原有变量未动。新修订 `ca-skatgo--0000011` 仍是旧镜像，线上表现不变。

## Residual

- **Google 登录在生产实例未配置**（`clerk deploy status` 显示 oauth pending: google）。开发实例用的是 Clerk 的共享凭据，生产需要你自己的 Google OAuth 客户端；否则弹窗里的「Continue with Google」在线上会失败。可以二选一：配凭据，或在生产实例里关掉 Google、只留邮箱+密码。
- **生产环境的登录后流程只能由真人验证**：`+clerk_test` 测试码只在开发实例有效，生产的新设备验证会发真邮件。部署后请你按指南用导航注册第一个账号。
- **`CLERK_SECRET_KEY` 曾以明文出现在对话里**，建议上线后在 Clerk 后台轮换一次，我再更新 Azure 的 secret。
- **charter 与现状的出入又多了**：engineering.md「no API … no database」（现在还有账号，仍无数据库）、product.md「It is only the course」（多了账号）、ui.md 第三方样式例外（除 deep-chat 外又有 Clerk）。由你修改。
- 开发实例里留着验收账号 `skatgo-ac+clerk_test@example.com`，对生产无影响。
- 依赖审计里那个 high（js-yaml，来自 TanStack Start 的构建工具）main 上本来就有，不是本单引入。
