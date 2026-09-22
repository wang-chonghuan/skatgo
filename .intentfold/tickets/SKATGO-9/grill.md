# SKATGO-9 grill（自行裁决，用户 2026-09-22 授权）

依据只有两样：charter，和实际观察到的代码 / 运行结果。

1. **前提成立吗？** — 成立。用 trovestep 的端点与 key 直接调 `gpt-5.6-luna`、`reasoning_effort: medium`：HTTP 200，1.9 秒，模型名 `gpt-5.6-luna-2026-07-09`。deep-chat-react@2.5.1 装好；dist 里没有 `process.env`/`Buffer`（check-client-bundle 不会红）。
2. **服务端接口放哪？** — TanStack Start 路由文件 `routes/api.ask.ts` 的 `server.handlers.POST`（该版本支持，官方文档）。不引入 Express 之类（engineering Guidance「No gratuitous dependencies」）。Paraglide 中间件会把无前缀 URL 重定向，所以 `/api/ask` 加进 `routeStrategies exclude`，与 sitemap/robots 同一机制（观察自 paraglide.options.ts）。
3. **上下文怎么给？** — 服务端按 `locale + page + lessonId` 从 `lib/skat/lessons/content` 重建，浏览器不传页面文本。理由：防止客户端塞任意大 prompt 刷费用；且课文本就是内容源。`generated` 步骤跳过（服务端不能调 Math.random 的 make()，engineering「Anything random runs in the browser only」）。
4. **「不提供会话历史」怎么解释？** — 跨刷新不保存（不用 deep-chat 的 browserStorage、不传 history、服务端不存）；弹窗打开期间允许带最近 6 条消息作为追问上下文，否则「它是什么意思」这类追问答不了。换页面时组件 `key` 换，上下文随页面走。
5. **限流数字** — 每 IP 10 次/分钟、全站 500 次/天、问题 ≤ 500 字符、回答 ≤ 700 token、30 秒超时。依据：单副本（operations.md「min = max = 1」）所以进程内计数够用；数字是保守估计，用户可改，写进 handoff 的 Residual。
6. **和 ui.md 的关系** — 浮动按钮与弹窗外壳用 StyleX + `skat.*` token；deep-chat 的样式属性接受 CSS 值，直接传 `skat.paper` 这类 `var(--…)` 字符串（观察：defineVars 运行时值就是 var() 串），不写颜色字面量；不写 `className=`/`style={{`。第三方组件自带样式一事用户已批准。
7. **/play 不显示** — 按路径前缀判断（`useRouterState` 的 pathname 已去掉语言前缀，观察自 skat-layout.tsx）。第 11 课里的整局是课程页，按工单「除对局页」照常显示按钮。
8. **验收会不会打牌？** — 不会。AC 只验按钮、弹窗、一问一答、刷新清空、限流、布局（用户 2026-09-21 指示）。
9. **env 名** — 沿用 `LLM_BASE_URL` / `LLM_API_KEY`（和 trovestep 一致，复制即用），另加可选 `LLM_MODEL`（默认 gpt-5.6-luna）、`LLM_EFFORT`（默认 medium）。生产要新增这两个 secret/env：由 cap4/部署时用户执行，handoff 里列出。
10. **需要人类决定而我不能替的** — 无。engineering.md / product.md 的 Contract 文字更新由用户做，handoff 里列出具体该改的句子。
