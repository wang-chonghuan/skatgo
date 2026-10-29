# SKATGO-152 AC check plan

线上（skatgo.com）条目只能在部署后核对；本地先核对代码路径与派发的事件。

1. **登录后 person 带账号 id、合并登录前历史** — 本地：测试账号登录，window `skatgo:identify` 带 id；线上部署后：PostHog persons 按 Clerk id 能查到，`player` = `user:<id>`，同一 person 下有登录前的 pageview。
2. **登出后不归到账号** — 本地：登出（清测试 cookie）后派发 `skatgo:identify` null 且调用 reset；线上：登出后新事件的 distinct id 不是账号。
3. **不请求 posthog.com 域；国家城市是访客的** — 本地：`curl /hx/static/array.js` 200（来自 eu-assets），`/hx/flags/` 能到 eu.i；请求不带 cookie。线上：浏览器网络面板无 posthog.com 请求；PostHog 事件 `$geoip_country_name` 为访客国家。
4. **uBlock Origin 默认规则下仍到达** — 用 EasyPrivacy/uBlock 默认过滤表 grep `/hx/` 的路径；线上用装了 uBlock 的浏览器确认 pageview 与对局结束到达。
5. **新访客有 profile 带初始来源和落地页** — 线上：新的匿名 person 有 `$initial_referrer`、`$initial_current_url`。
6. **新字段与四个新事件；无逐张出牌事件** — 本地看 `skatgo:track`：一局 `game_finished` 带 role/contract/bid/sf/ai_sf；一轮 `free_round_finished`；一道题 `exercise_finished`；点登录 `sign_in_clicked`；新测试账号 `account_signed_up` 一次；代码中无 bid/card 级 track。
7. **daily 完成事件带榜单名** — 本地 daily 1-deal 完成后 `daily_finished` 带 `name`（不脚本打牌：读代码 + 已有完成局的路径；或用户实测）。
8. **隐私政策提到关联与转发；无弹窗** — 本地 `/en/privacy`、`/datenschutz` 看文字；页面无同意弹窗。
