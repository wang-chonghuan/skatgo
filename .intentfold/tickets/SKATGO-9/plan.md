# SKATGO-9 plan — 浮动问答助手

## 代码里已经有的、工单没说的

- 页面框架 `src/skat-layout.tsx` 包着每个路由（`<Outlet/>`），是挂浮动按钮的自然位置；它能从 `useRouterState` 拿到去掉语言前缀后的路径（`/`、`/lesson/4`、`/play`）。
- 服务端没有任何路由；`src/server.ts` 里 Paraglide 中间件会把**没有语言前缀的 URL 重定向**到带前缀的地址。`/sitemap.xml`、`/robots.txt` 靠 `paraglide.options.ts` 的 `routeStrategies exclude` 逃开。`/api/ask` 必须同样排除。
- TanStack Start 1.168 支持在路由文件里用 `createFileRoute('/api/ask')({ server: { handlers: { POST } } })` 定义服务端处理器；文件名 `api.ask.ts`。
- 课程内容 `lib/skat/lessons/content.ts` 按语言给出 11 课的 `Lesson`（title / promise / steps）；teach 步骤有 title、body、tip；choice/pick/order/play 有 prompt、explain。`generated` 步骤只有 `make()`，不能在服务端调用（Math.random）。
- 颜色 token `theme/skat.stylex.ts` 通过 `stylex.defineVars` 导出，运行时每个值是 `var(--…)` 字符串，可以原样交给 deep-chat 的样式属性；CSS 自定义属性能穿进 shadow DOM。
- `scripts/check-client-bundle.mjs` 扫所有浏览器 chunk；已核对 deep-chat 的 dist 里没有 `process.env` / `Buffer.from`（0 命中）。
- Paraglide 消息函数接受 `{ locale }` 第二参数，服务端可以按请求语言取文案。
- 生产只有一个副本（`min = max = 1`），进程内的限流计数够用。

## 已核实的前提

- Azure 端点 `…/openai/v1/chat/completions`，`model: gpt-5.6-luna`，`reasoning_effort: medium`：HTTP 200，约 2 秒，返回 `gpt-5.6-luna-2026-07-09`。env 名沿用 trovestep：`LLM_BASE_URL`、`LLM_API_KEY`。
- `deep-chat-react@2.5.1`（MIT）已装；peer react ≥16.8；包大小 deepChat.js 785 KB，只在第一次点开时按需加载。

## 路线

1. **服务端** `src/lib/ask/`
   - `context.ts`：`buildSystemPrompt(locale, page)` — 规则速览（ISkO 要点，英文写，答复用页面语言）+ 当前页面内容：`lesson` → 该课的 title/promise/每个 teach 的 title/body/tip、每道题的 prompt/explain（跳过 generated）；`home` → 11 课的 title/promise。
   - `limits.ts`：进程内限流：每 IP 每分钟 10 次（滑动窗口）、全站每天 500 次（UTC）、问题 ≤ 500 字符、历史最多 6 条；超限返回 429。
   - `azure.ts`：`ask({system, messages})` → 调 `${LLM_BASE_URL}/chat/completions`，`model = LLM_MODEL ?? 'gpt-5.6-luna'`，`reasoning_effort = LLM_EFFORT ?? 'medium'`，`max_completion_tokens 700`，30 秒超时；不记录任何消息正文。
   - 路由 `src/routes/api.ask.ts`：POST，校验 body（locale ∈ locales，page ∈ {home, lesson}，lessonId 存在，messages 形状），返回 deep-chat 的 `{text}` 或 `{error}`（错误文案按 locale 取 Paraglide 消息）。未配置 env → 503。
   - `paraglide.options.ts`：`routeStrategies` 加 `{ match: '/api/ask', exclude: true }`。
2. **浏览器** `src/components/skat/ask.tsx`
   - `AskLauncher`：挂在 `SkatLayout` 的 `<main>` 之后；路径以 `/play` 开头时不渲染。固定在右下角的圆按钮（felt 色系，brass 描边），打开后是一块 `Panel` 风格的弹窗：桌面 380×min(560, 80vh) 贴右下；≤480px 时贴底全宽、高 78vh。头部：标题 + 关闭按钮。
   - 弹窗内容 `React.lazy(() => import('deep-chat-react'))` + Suspense，占位用现有的加载文案样式。`key` 用当前路径：换页面就换实例（上下文跟页面走）；不用 `browserStorage`、不传 `history`，刷新即清空。
   - `connect: { url: '/api/ask', additionalBodyProps: { locale, page, lessonId } }`；`requestBodyLimits: { maxMessages: 6 }`；`textInput.characterLimit: 500`；`introMessage`、placeholder、错误文案走 Paraglide；样式属性用 `skat.*` token 组成的常量对象。
   - 三语文案：`messages/{zh,en,de}.json` 加 `ask_*` 键。
3. **测试** `src/lib/ask/ask.test.ts`：system prompt 三语各含本课 teach 标题、首页含 11 课、未知课返回 null；限流器按 IP 与总量拒绝。
4. **验收脚本** `.intentfold/tickets/SKATGO-9/tmp/ac.mjs`（Playwright，headed）：按 ac.md 逐条跑，桌面 + 手机。

## 顺序

服务端 + 测试 → 浏览器组件 + 文案 → 本地构建跑起来手工试一次 → 写验收脚本跑 → 机械防线 → handoff。
