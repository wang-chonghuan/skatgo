# SKATGO-74 handoff

## 改了什么

- **PostHog 的自动事件全部关掉**（`app/src/components/product-analytics.tsx`）：
  - init 里明确写出 `autocapture`、`rageclick`、`capture_dead_clicks`、`capture_heatmaps`、`capture_performance`、`capture_exceptions` 都为 false；
  - 只留 `capture_pageview: 'history_change'` 和 `capture_pageleave: true`；
  - 写明而不依赖默认值，项目后台设置也盖不过它。
- **埋点清单成为代码里的唯一来源**（`app/src/lib/analytics.ts`）：
  - `ProductEvents` 类型列出每个事件、它的属性，以及触发时机（注释）；
  - `track()` 只接受清单里的事件名和对应属性。清单外的事件，或属性不对的调用，类型检查不通过。
- **事件位置**：

  | 事件 | 在哪里发 |
  |---|---|
  | `home_cta_clicked {button}` | `entry-page.tsx` 首页主按钮（原 `hero_cta_click`，去掉了 `state` / `variant`） |
  | `lesson_started` / `lesson_completed {lesson}` | `lesson-player.tsx`（原 `lesson_start` / `lesson_complete`） |
  | `course_complete_cta_clicked` | `course-home.tsx`、`lesson-player.tsx` 学完后去自由对局的按钮（原 `course_complete_cta_click`） |
  | `game_started {mode}` / `game_finished {mode, won, score}` | `server-table.tsx`，自由对局（`free`）和第 11 课牌局（`lesson`）共用；`ServerTable` 新增必填的 `mode` 属性 |
  | `daily_started` | `daily-table.tsx` 锦标赛页面的开始按钮，仅当今天还没开始时 |
  | `daily_finished {total}` | `daily-table.tsx`，服务器回复中当天第一次变为已打完时 |
  | `daily_nickname_set` | `daily-table.tsx`，昵称保存成功时 |
  | `room_created` / `room_joined` / `room_started {humans}` | 不变 |
  | `assistant_asked {context}` | `ask-thread.tsx`，每个问题发出时 |

- **叫牌、出牌、收墩、提示等每一步操作都不发事件。**
- **新增单元测试** `app/src/lib/analytics.test.ts`：覆盖服务器渲染时不发事件，以及事件广播时带上属性、语言和路径。

## AC 结果

**验收方式**：
- 本地 web 跑在 55074，multiplayer 跑在 56074，数据库在 57074；
- 启动时用假项目 key `phc_ticket74acceptance` 覆盖了 `.env` 里的真 key；
- Playwright 有头 Chromium 把 `skatgo.com` 解析到本机，按 `http://skatgo.com:55074` 打开，PostHog 正常启动；
- 发往 `*.posthog.com` 的请求全部在浏览器里拦下、解码、就地返回，一条都没转发；
- 远端配置用 SKATGO-25 存下的生产项目配置，里面开着热图和网页性能，用来证明 init 的显式设置盖得过后台设置。

脚本是 `tmp/ac74.mjs`，结果在 `tmp/ac74.json`。

1. **叫牌、出牌不发事件：通过。**
   - 桌面（1280×820）和手机（375×812，触屏）各开一局自由对局。
   - 开桌时 PostHog 收到 `$pageview` 和 `game_started {mode: free}`。
   - 之后各做了 6 步操作：过牌、出牌（每张牌连点 4 下，模拟 rageclick）、收墩。
   - 这段时间 `skatgo:track` 广播 0 条。PostHog 只收到 1 条 `$pageleave`，那是脚本自己为了冲刷队列触发的 pagehide。
   - 没有 `$autocapture`、`$rageclick`、`$dead_click`、`$$heatmap`、`$web_vitals`，页面也没有报错。
2. **埋点清单与实际事件一一对应：通过。**
   - **路径**：首页主按钮 → 课程 → 第 1 课做完 → 自由对局 → 和朋友开一张桌（桌面）。
   - **广播和 PostHog 都恰好各一次**，顺序如下，名字和属性与清单一致：
     1. `home_cta_clicked {button: primary}`
     2. `lesson_started {lesson: 1}`
     3. `lesson_completed {lesson: 1}`
     4. `game_started {mode: free}`
     5. `room_created`
   - **以下事件没有在验收中验证，留给用户实测**，见「偏差」：
     - 需要打完一副牌才触发的：`game_finished`、`daily_finished`、`daily_nickname_set`（按 grill 第 4 题）；
     - 验收路径没走到的：`course_complete_cta_clicked`（要学完全部 11 课）、`room_joined` 和 `room_started`（要第二个人入座并开局）、`assistant_asked`（提问会真实调用 Azure 模型，产生费用）。
3. **页面浏览仍被记录：通过。** 每次换页都有一个 `$pageview`：
   - `/`
   - `/de/taeglich`
   - `/de/kurs`
   - `/de/kurs/wie-funktioniert-skat`
   - `/de/spielen`
   - `/de/mit-freunden`
   - `/de/tisch/<号>`
   - `/`
   - `/de/kurs`
   - `/de/regeln/zum-ausdrucken`

   离开时有 `$pageleave`。

**机械防线**：typecheck、build、test（13 个文件，104 个测试）、client bundle、design tokens、literal grep、SSR 链接、`check:seo --built`、`test:seo`，全部通过。multiplayer 没有改动，没有跑它的检查。

## 偏差

- **清单多了一个事件**：grill 第 2 题的表里漏了现有的 `course_complete_cta_click`，新的类型检查把它找了出来。按第 3 题的改名规则，改为 `course_complete_cta_clicked` 保留下来。清单现在共 15 个事件，含 2 个自动的页面浏览。
- **`daily_started` 挂在锦标赛页的开始按钮上**，没有挂在进入对局页时。服务器只知道「今天的记录存不存在」，而进入对局页就会建出这条记录，所以对局页无法分辨是不是第一次进来。只能在开始按钮上判断，代价是：页面还没读到今天状态之前就点按钮（很少见），会漏记一次。
- **单元测试只覆盖 `track()` 本身**：
  - grill 第 4 题说「由单元测试覆盖触发条件」，但项目里没有 DOM 测试环境（没有 jsdom 或 testing-library），加依赖属于 engineering.md 红线 3，需要你批准；
  - `game_finished` 挂在牌桌已有的结算回调上，就是记录胜负统计的那个，现有行为没变；
  - `daily_finished` 的条件是一行比较。
  - 这三个事件以上线后你在 PostHog 里看到为准。
- **第 11 课牌局的抽查没做**：它和自由对局是同一个 `ServerTable` / `GameTable`，只是 `mode` 不同。
- **验收专用的绕行**：Clerk 开发实例在借用的 `skatgo.com` 主机名上握手会无限重定向，所以测试浏览器先从开发实例（不是生产）取一个 dev-browser token 放进 cookie。产品代码没改。

## 环境

- **端口**：web 55074，multiplayer 56074，数据库 57074。
- **worktree 里的 `.env`**：只为本地验收改了端口行。`app/.env` 的 `MULTIPLAYER_URL` 指向 56074，`multiplayer/.env` 的 `DATABASE_URL` 端口改为 57074。合并时不同步这两行。
- **env 键**：没有新增、改动或删除。假 PostHog key 只在启动命令里覆盖，没写进任何文件。

## 遗留

- **隐私页**（`lib/legal.ts`）写的是「页面浏览和交互事件，如课程和对局操作」。现在收集的更少，这句话仍然成立；要写得更精确可以另开工单。
- **PostHog 后台**：项目设置里的 autocapture、热图、网页性能开关已经不起作用了，可以顺手关掉，免得以后误会。这是后台操作，不在本单范围。
