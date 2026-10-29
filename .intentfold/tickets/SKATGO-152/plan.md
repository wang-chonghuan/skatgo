# SKATGO-152 plan

## 代码里发现的、工单没写的

- PostHog 只在 `product-analytics.tsx` 里 init，组件放在 `ClerkProvider` 外面，拿不到账号；`track()` 只在 `isPublishedSite` 时发送，同时总是派发 window `skatgo:track`（本地验收靠它）。
- Clerk 的 `SignInButton` / `SignUpButton` 会先调子元素自己的 `onClick` 再开弹窗，所以埋点直接写在 `Btn` 上即可，不用包装组件。共 10 处（header、首页、daily、profile、两个练习门、论坛两处、私桌开桌、私桌注册）。
- `game_finished` 只由 `ServerTable`（自由对局 + 第 11 课）发；结算时 `game` 就在手边，AI 同座的分来自已缓存的 `ask(token)` 复盘（结果卡本来就会请求它，不多一次请求）。
- daily 结束时 `DailyStatus` 不带名字；名字在完成那一刻由服务端写入，`dailyBoard` 的 `me.nickname` 就是它。完成时读一次榜单即可，不动 multiplayer。
- 隐私政策 `lib/legal.ts` 第 52 行写着 "Google 登录资料不会发给分析"——所以 person 属性不带 email / 真名，保持这句为真，隐私只改分析那一段。
- 本地测试账号（SKATGO-117）只把 id 交给页面；新注册判断要创建时间，`readTestAccount` 一并带出 `createdAt`。

## 路线

1. **代理** `app/src/lib/analytics-relay.ts`，`server.ts` 在 locale 中间件前接 `/hx/*`：`/hx/static/*`、`/hx/array/*` → `eu-assets.i.posthog.com`，其余 → `eu.i.posthog.com`；只转 content-type / content-encoding / user-agent，**不转 cookie**；`X-Forwarded-For` = 访客 IP（复用 `free-handler` 的 `clientIp`，导出它）。
2. **init**：`api_host: '/hx'`，`ui_host` 不变，`person_profiles: 'always'`；`ProductAnalytics` 挪进 `ClerkProvider`。
3. **identify**：同一组件里，Clerk 加载完（或本地测试账号）后：有账号 → `posthog.identify(<Clerk id>, {player: 'user:<id>'}, {account_created_at})`；从匿名变成已识别且账号建于 1 小时内 → 一次 `account_signed_up`；没账号而 PostHog 仍是已识别 → `reset()`。本地派发 window `skatgo:identify` 供验收。
4. **事件**（`ProductEvents` 里加类型）：
   - `game_finished` 增 `role`、`contract`、`bid`、`sf`、`ai_sf`（未知为 null）。
   - `free_round_finished { total, ai_total }`：第六副结束进总结时一次。
   - `exercise_finished { section, number, right }`：牌技练习（section = 练习类型）和叫牌练习（section = `bidding`），首答一次。
   - `sign_in_clicked { at }`：10 处按钮。
   - `account_signed_up`：见 3。
   - `daily_finished` 增 `name`；同时把 nickname 写到 person（`setPerson`），改昵称时也写。
5. **隐私**：`lib/legal.ts` 分析段第二句 EN/DE 改为：登录后事件（含同一浏览器登录前的）关联到账号 id，经 skatgo.com 转发；更新日期。
6. **章程**：`engineering.md` PostHog 条目；`product.md` 第 241 行那句。
