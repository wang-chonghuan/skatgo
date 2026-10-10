# SKATGO-77 plan

## 代码里有、工单没写的

- **每日赛的长度只在一处：** `DAILY_DEALS = 6`（`app/src/lib/skat/tournament.ts`）。服务端发牌、校验、结算，网页标题、元描述和首页元描述都读它。
- **表结构按「一天一套牌、一人一天一条」建：** `daily_deals` 的主键是 `day`，`daily_entries` 的主键是 `(day, player)`。同一个人同一天打两个赛，必须改主键，属于生产表结构变更（operations.md Redline 5，需要人同意）。
- **发牌：** leader 每小时预发今天和明天（`prepareDays`），每次准备有 10 分钟上限。生产上 6 副约 3 分钟，12 副按比例约 6 分钟，分开准备都在上限内。
- **登录认领：** 设备上的匿名记录会转到账号（`dailyClaim`）。改成两个赛后，两个赛的记录分别转。
- **页面：** `/daily` 由服务端渲染标题、说明和当天的牌局列表，浏览器再取个人状态和排行榜。`/daily/play` 是全屏牌桌，打完回到 `/daily`。现在任何路由都没有用 search 参数。
- **待定：** 页面布局、名称和标题、表结构上线、charter 修改，见 grill。

## 路线

1. **规则层**（`tournament.ts`）：`DAILY_SIZES = [6, 12]`，`DailySize` 类型，`DAILY_DEALS` 改为默认赛的长度 6；`DailyStatus` 加 `size`。
2. **multiplayer**（`src/store.ts`、`src/daily.ts`）：
   - 迁移：两张表加 `size integer NOT NULL DEFAULT 6`，已有行自动成为 6 副赛；主键改为 `(day, size)` 和 `(day, size, player)`，外键跟着改。迁移可重复执行。
   - `prepareDay(day, size)`：按 size 发牌，每次准备各自 10 分钟上限；`prepareDays` 依次准备今天 6、今天 12、明天 6、明天 12。12 副赛的 skat 尝试顺序加上 size 作种子，6 副赛不变。
   - 各路由输入加可选的 `size`，缺省为 6，这样先上线 multiplayer 时旧网页照常工作；结算循环用这套牌的长度，不再用常量。
   - 认领：同一天每个赛分别转，账号在那个赛已有记录的不转。
3. **网页**：
   - `daily-api.ts` 各调用带 `size`；`daily-handler.ts` 不变（body 原样转发）。
   - `/daily` 和 `/daily/play` 用 search 参数 `deals=12` 选赛，缺省 6。
   - `/daily`：按 grill 定的布局展示两个赛，各自的按钮、当天牌局列表、结果、昵称和排行榜（今天、昨天）。
   - `/daily/play`：打完或日期变了，回到 `/daily` 的同一个赛。
   - 文案：标题、元描述、说明里的副数按 grill 定；首页元描述同样处理。
   - 埋点 `daily_started`、`daily_finished` 加属性 `deals`。
4. **生成物**：`/daily` 的 h1 变了，就用 SKATGO-50 的脚本重画德文、英文两张分享预览图。
5. **charter**：grill 同意后，再改 product.md 和其他 charter 里每天 6 副的说法。

## 和工单建议方案的出入

无。
