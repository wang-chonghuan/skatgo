# SKATGO-74 plan

## 代码里已有、工单没说的

- **洪水的来源是 PostHog 自己的自动事件，不是手写事件。** `components/product-analytics.tsx` 用 `autocapture: true` 和 `defaults: '2026-05-30'` 启动 posthog-js 1.434.17。按这组默认值，SDK 会自动发：
  - `$autocapture`：每次点击，包括每张牌、每个叫牌按钮；
  - `$rageclick`：快速连点。出牌、收墩时连点很常见；
  - `$dead_click`、`$$heatmap`、`$web_vitals`，以及项目后台开着时的 `$exception`。
- **手写事件只有 6 个**，都经过 `lib/analytics.ts` 的 `track()`：
  - `hero_cta_click {state, variant, button}`：首页主按钮；
  - `lesson_start {lesson}`、`lesson_complete {lesson}`：课程；
  - `room_created`、`room_joined`、`room_started {humans}`：私人牌桌。
  
  `track()` 自动加上 `locale` 和 `page`，并在 window 上广播一个 `skatgo:track` 事件，供本地检查观察。
- **没有任何对局里程碑事件**：自由对局、第 11 课的牌局、每日锦标赛的开始和结束，都只能靠点击去猜。
- **PostHog 只在正式站点加载**：`isPublishedSite` 要求主机名是 `skatgo.com`，而且要有 `POSTHOG_PROJECT_KEY`。本地和预览地址都不发事件。
- **隐私页**（`lib/legal.ts`）写的是「页面浏览和交互事件，如课程和对局操作」。改完后实际收集的更少，这句话仍然成立，不必改。
- **账号**：登录由 Clerk 弹窗完成，前端没有可靠的「刚注册」时机。按 SKATGO-25 的约定，也不把 Clerk 账号告诉 PostHog。

## 路线

1. **只留页面浏览，其余自动事件全关。**
   - 在 `posthog.init` 里明确写出：`autocapture: false`、`rageclick: false`、`capture_dead_clicks: false`、`capture_heatmaps: false`、`capture_performance: false`、`capture_exceptions: false`；
   - `capture_pageview: 'history_change'` 和 `capture_pageleave` 保持开着。
   
   写明而不依赖默认值，是因为默认值和后台设置都可能变。
2. **埋点清单写成代码里的唯一来源。** 在 `lib/analytics.ts` 里定义事件表：事件名映射到属性类型，每条注释写明触发时机。`track()` 只接受表里的事件名和对应属性，清单外的事件编译不过。
   - 命名用 `对象_动作`：snake_case，动作用过去式。
   - 每个用户行为只发一次，差异放在属性里。
3. **清单内容**（grill 第 1、2 题定稿）：

   | 事件 | 时机 | 属性 |
   |---|---|---|
   | `$pageview` / `$pageleave` | SDK 自动 | — |
   | `home_cta_clicked` | 首页主按钮 | `button` |
   | `lesson_started` | 打开一节课 | `lesson` |
   | `lesson_completed` | 一节课最后一步完成 | `lesson` |
   | `game_started` | 自由对局或第 11 课牌局发好一副牌 | `mode`（`free` / `lesson`） |
   | `game_finished` | 这副牌结算 | `mode`、`won`、`score` |
   | `daily_started` | 当天第一次进入锦标赛 | — |
   | `daily_finished` | 当天 6 副全部打完 | `total` |
   | `daily_nickname_set` | 成绩上了排行榜 | — |
   | `room_created` / `room_joined` / `room_started` | 不变 | `room_started` 带 `humans` |
   | `assistant_asked` | 向 KI 教练发出一个问题 | `context`（所在页面类型） |

4. **埋点位置**：
   - `game_*` 放在 `ServerTable`，用 `mode` 区分自由对局和课程，另加一个结算回调；
   - `daily_started` 在 `DailyTable` 打开时触发，用 `status.started` 由 false 变 true 来判断；
   - `daily_finished` 在 `send()` 的回复里 `status.finished` 第一次为 true 时触发；
   - `daily_nickname_set` 在 `Nickname.save` 成功时触发；
   - `assistant_asked` 放在 `ask-thread.tsx` 发请求处。
   
   叫牌、出牌、收墩、提示等每一步操作都不加事件。

## Redline 查对

- **engineering 3（依赖）**：不加、不改依赖，posthog-js 版本不动。
- **engineering 1（凭据）**：验收用的假项目 key `phc_…` 只放在本地 `.env`，不提交。
- **operations 2（生产数据）**：验收拦截所有发往 eu.i.posthog.com 的请求，就地返回，不转发，不污染生产项目。
- **operations 5（环境变量）**：不新增生产环境变量。
- **ui**：不碰样式和 token。
