# SKATGO-9 handoff — 浮动问答助手

首次交付基线。开发：cap3 自主开发，Grill: self（用户授权）。Finish: review。

## What changed

**功能**：课程目录页和每一课的右下角有一个浮动「问一问 / Ask / Fragen」按钮；对局页 `/play` 没有。点开是一个小聊天弹窗，学习者可以就斯卡特规则和当前页面的内容提问，用页面语言得到回答。对话只存在于弹窗里：不进 localStorage、不进服务端，刷新页面或换页面就是新会话；弹窗打开期间允许带最近 6 条消息做追问。

**服务端（新增，本站第一个服务端路由）**
- `app/src/routes/api.ask.ts` — `POST /api/ask`：校验 body（locale / page / lessonId / messages），限流，转发到模型，返回 deep-chat 需要的 `{text}` 或 `{error}`（错误文案按 locale 取 Paraglide 消息）。`GET /api/ask` 返回 `{ok, configured}`，供 operations.md 的部署后检查（它按路由树逐个 GET）和人眼查看。
- `app/src/lib/ask/context.ts` — 系统提示：ISkO 规则速览 + 当前页面（该课所有讲解、题目与解释；随机练习跳过；目录页则是 11 课概览），三语从 `lib/skat/lessons/content` 重建，浏览器不传页面文本。
- `app/src/lib/ask/limits.ts` — 进程内限流：每 IP 10 次/分钟、全站 500 次/天（UTC）、问题 ≤ 500 字符、历史 ≤ 6 条、回答 ≤ 700 token、30 秒超时。
- `app/src/lib/ask/azure.ts` — 调 `${LLM_BASE_URL}/chat/completions`，模型 `LLM_MODEL`（默认 `gpt-5.6-luna`），`reasoning_effort` = `LLM_EFFORT`（默认 `medium`）。不记录任何消息正文；上游错误只记状态码。
- `app/paraglide.options.ts` — `/api/ask` 加入 `routeStrategies exclude`；`app/src/router.tsx` — `rewrite.output` 对被排除的 URL 不加语言前缀（否则 GET /api/ask 被路由器 307 到 /en/api/ask）。

**浏览器**
- `app/src/components/skat/ask.tsx` — 浮动按钮、弹窗外壳（StyleX + `skat.*` token；桌面 380×min(560, 100vh−100) 贴右下，≤480px 为贴底抽屉 78vh），deep-chat 只在第一次点开时 `lazy` 加载；deep-chat 的颜色通过它的样式属性传 token（`var(--…)`）。
- `app/src/skat-layout.tsx` — 在 `<main>` 之后挂 `<AskLauncher />`。
- `app/messages/{zh,en,de}.json` — 新增 13 个 `ask_*` 文案。

**依赖**（用户 2026-09-22 批准）：`deep-chat-react@2.5.1`（带 `deep-chat@2.5.1`、`@lit/react`），MIT。dist 无 `process.env`/`Buffer` 引用；浏览器包只在点开弹窗时加载（约 785 KB 未压缩）。

**测试**：`app/src/lib/ask/ask.test.ts`（上下文覆盖三语 11 课、限流行为）；`app/src/lib/sitemap.test.ts` 的页面推导排除 `/api/` 路由（服务端路由不是页面）。

## AC results（`tmp/ac.mjs`，Playwright headed Chromium，对已构建的服务 :55009；最后一轮 20/20）

1. **浮动按钮只在课程页面** — PASS（桌面 + 手机）：`/zh`、`/zh/lesson/4` 各有 1 个 `ask-launcher`，`/zh/play` 0 个；点开后 `ask-panel` 可见，点 `ask-close` 后消失；无控制台错误。
2. **三语提问得到本页语言回答** — PASS：zh「什么叫必须跟牌？」→「“必须跟牌”就是：这一墩的首出是什么花色，只要你手里有这门花色，就必须出这门……」；en → "Following suit means playing a card of the same suit as the lead…"；de → "Bedienen heißt: Du musst die Farbe der ausgespielten Karte spielen, wenn du eine K…"。每次约 3–6 秒。回答质量未评。
3. **刷新即清空** — PASS：提问得到回复后 `getMessages()` 为 2 条，reload 后重新打开为 0 条。
4. **限流与 key 不外泄** — PASS：同一地址连发 12 次，第 11、12 次 429，JSON `{"error":"You're asking quickly — take a minute, then try again."}`；600 字问题 413；浏览器发出的 `/api/ask` 请求头和体里没有 bearer/api-key；仓库工作树和 `.output/` 用 key 前 8 位 grep 为 0 命中（handoff 前人工执行）。
5. **桌面与手机布局** — PASS：桌面面板 box (865,184,380×560) 在 1280×820 内；手机 (0,178.6,375×633.4) 在 375×812 内；输入框可输入；`scrollWidth` 不超过视口。

## Deviations from plan.md

- 多了 `GET /api/ask` 与 `router.tsx` 的改动（计划只写了 Paraglide 排除）：实际发现是 TanStack Router 的 `rewrite.output` 在给 GET 加前缀并重定向。
- `sitemap.test.ts` 改了页面推导：路由树里出现了非页面的 `/api/ask`，测试按旧前提会要求它进 sitemap。

## Environment

- 端口：web **55009**（验证模式下服务仍在运行：`http://localhost:55009/zh/lesson/4`）。
- 本地 `app/.env`（git-ignored，从 trovestep 复制，未提交）：`LLM_BASE_URL`、`LLM_API_KEY`。运行方式：`(cd app && set -a && source .env && set +a && PORT=55009 node .output/server/index.mjs)`。
- **生产需要新增**（operations.md Redline 5，用户已批准，部署时执行）：Container App `ca-skatgo` 增加 secret + env `LLM_BASE_URL`、`LLM_API_KEY`；可选 `LLM_MODEL`（默认 gpt-5.6-luna）、`LLM_EFFORT`（默认 medium）。未配置时接口答 503，页面其余部分不受影响。
- 主检出 `.env` 同步：主检出没有 `app/.env`；cap4 时把这两个键同步过去即可（handoff 只列键名）。

## Residual

- **charter 需要用户更新**：engineering.md Contract「There is no API, no server function」→ 现在有一个转发路由 `/api/ask`，无数据库；product.md「It is only the course」→ 加了一个只答规则与本页内容的问答助手；ui.md Redline 3「第二份样式表」→ deep-chat 自带样式（已批准，宜记一笔例外）。operations.md 的部署后检查无需改动（GET /api/ask 返回 200）。
- 限流数字是保守估计（10/分/IP，500/天），可按实际用量调；计数在进程内，重启归零，多副本时各算各的。
- 模型回答的正确性没有自动评估；建议用户亲自问几个刁钻问题看看。
- 手机模拟下，课程页面加载时布局视口会瞬时拉宽到 ~391px（步骤滑入动画所致，主线已有，本单未引入、未修）。
- 弹窗打开期间在手机上遮住了浮动按钮，关闭靠弹窗头部的 ✕；桌面两者都可用。
