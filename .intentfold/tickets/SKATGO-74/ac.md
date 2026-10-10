# SKATGO-74 ac

**PostHog 只在正式站点加载**，所以验收要模拟正式站点：

- 本地 web 跑在 55074，带一个假项目 key；
- Playwright 的 Chromium 用 `--host-resolver-rules` 把 `skatgo.com` 解析到 127.0.0.1，按 `http://skatgo.com:55074` 打开；
- `page.route('https://eu.i.posthog.com/**')` 和 `https://eu-assets.i.posthog.com/**` 记录每个请求后就地返回 200，不转发。

PostHog 请求体可能压缩，所以同时记录两样东西：

- `skatgo:track` 广播；
- 拦截到的请求，解码其中的事件名，解不开的按请求计数。

按记忆规则，验收不完整打牌。

## AC1 叫牌、出牌不发事件

- **步骤**：
  1. 打开自由对局，等牌发好，清空记录；
  2. 叫牌或过牌，再出几张牌，等 3 秒让 PostHog 的批量发送出去。
- **通过**：
  - 这段时间没有任何 `skatgo:track` 广播；
  - 没有任何发往 PostHog 的事件（`$autocapture`、`$rageclick`、`$dead_click`、`$$heatmap` 等都没有）。
- 第 11 课的牌局和私人牌桌用同一张桌子，抽查第 11 课牌局开桌后点一次。

## AC2 埋点清单与实际事件一一对应

- **清单**是 `app/src/lib/analytics.ts` 里的事件表，类型检查保证代码只能发表里的事件。
- **走一遍路径**，记录事件：首页主按钮、打开第 1 课并完成、打开自由对局、开一张私人牌桌。
  - 课程完成靠点完各步。第 1 课只有讲解和简单题，不算打牌。
  - 每个节点只发一次，名字和属性都与清单一致：
    - `home_cta_clicked`；
    - `lesson_started` / `lesson_completed {lesson: 1}`；
    - `game_started {mode: free}`；
    - `room_created`。
- **需要打完一副牌才触发的事件**留给用户实测：`game_finished`、`daily_finished`、`daily_nickname_set`。
  - 我这边只验证它们在代码里挂在结算点，并在单元测试里覆盖触发条件。
  - handoff 里写明「留给用户实测」，不写成通过。

## AC3 页面浏览仍被记录

- **步骤**：从首页点到课程页，再点到规则页。
- **通过**：拦截记录里每次切页都有一个 `$pageview`。
