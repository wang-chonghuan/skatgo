# SKATGO-61 plan

## 代码里已有、工单没说的

- **SKATGO-20 的房间是 Colyseus WebSocket 房间**（`multiplayer/src/room.ts`），charter 的 engineering.md 契约就是这么写的：每座位的视图走 socket，快照、座位令牌、指令回执存在 PostgreSQL。
- **但它目前只给受信的集成客户端用**：进房要带服务器的 admission key，浏览器不能持有。README 原话：以后做前端的工单要换成「服务器签发的短时准入」。
- **现有房间和工单要的不一样**：
  - 只能打一副（`start` 只在没有牌局时有效）；
  - 真人座位数在建房时就定死了；
  - 不存昵称，没有累计分；
  - 电脑用旧的启发式叫牌和出牌（`computerMove`），不是 SkatZero。
- **掉线**：30 秒宽限后由电脑代打；凭座位令牌重进回到原座位；24 小时无活动过期。这些都已经做好。
- **SkatZero 叫牌很贵**：每个座位每副要模拟 231 种底牌，本地约 1 秒，生产上更慢。所以自由对局从预先算好的牌池（`free-pool.json.gz`，1000 副）取牌。牌池只存了座位 1、2 的叫牌方案，没有座位 0 的。
- **前端**：
  - `GameTable` 默认本人坐 0 号位，对手叫 Lina / Max。房间里本人可能坐 1 或 2 号位，所以要把视图转到本人在下方，名字用昵称。
  - 自由对局、每日赛都经网站自己的 `/api/*` 转发，浏览器不直接连 multiplayer。
- **SKATGO-59 的认领和认输**在 `computers.ts` `advance` 里；房间的电脑走房间自己的计时循环，需要用同样的判断。
- **待定，交给 grill**：
  - 传输方式和新依赖；
  - 准入方式；
  - 邀请链接的形式；
  - 电脑怎么叫牌；
  - 开局和下一副的规则；
  - 入口和页面；
  - 统计事件。

## 路线（按 grill 的建议；以答复为准）

1. **准入**：
   - 网站新增 `POST /api/room/ticket`，按地址限频，签发 2 分钟有效的准入票：admission key 做 HMAC，标签 `skatgo-room/1`。
   - 房间 `onAuth` 接受准入票，也接受 admission key（集成客户端和测试）。
   - 网站同时告诉浏览器 multiplayer 的 WebSocket 地址。
2. **房间服务端**（`room.ts`、`model.ts`）：
   - 建房和入座都带昵称，复用 `nickname.ts` 的规则。
   - 房主（0 号座）随时可以开局：已入座的是真人，其余座位由电脑坐，开局后不再有人加入。
   - 一副结束后，任何真人都可以开下一副；发牌人轮转。
   - Seeger-Fabian 累计分存在快照里，和昵称、座位控制方一起公开。
   - 电脑：
     - 牌从自由对局的牌池里取，选发牌人对得上的那副，座位一一对应；
     - 叫牌和拿底或 Hand 用牌池里存好的方案；
     - 拿底后的扣牌和定约，以及出牌，实时用 SkatZero（与自由对局相同）；
     - SKATGO-59 的认领和认输在每个空墩检查。
   - 0 号座没有存好的叫牌方案，按 grill Q4 处理。
   - 快照结构改了，README 的协议说明一起改。
3. **前端**：
   - 新增依赖 `@colyseus/sdk`，版本与 multiplayer 测试用的 0.18.4 一致（engineering.md Redline 3，需要人批准）。
   - `app/src/lib/room-client.ts`：领准入票、建房或加入、监听状态、带 id 和 revision 发指令、处理回执。
   - 座位令牌按房间存在 localStorage，这是功能必需的存储；邀请令牌放在链接的 `#` 后面。
   - 路由：
     - `/room`（`/de/raum`、`/en/room`）：介绍和「开房间」；
     - `/room/$id`：个人页面，noindex，不进 sitemap。
   - 大厅：座位和昵称、复制邀请链接、房主的「开局」。
   - 牌桌：复用 `GameTable`，加 `room` 来源；`lib/skat/` 里新增一个纯函数，把视图转到本人在下方；座位牌和总分用昵称。
   - 入口：
     - 打牌页的阅读区；
     - 第 11 课课后的去处；
     - `/raum` 页。
   - 新增文案 de / en 各一套。
   - 统计事件：`room_created`、`room_joined`、`room_started`。
4. **测试**：
   - 视图旋转的纯函数做单元测试；
   - 准入票的签发和校验做单元测试；
   - `rooms.test.ts` 按新协议更新（建房不再定真人数，开局时定）。

## Redline 查对

- **engineering.md Redline 3**：新增 `@colyseus/sdk` 依赖，需要人明确批准，并记在工单上（grill Q1）。
- **engineering.md Redline 1**：不提交任何凭据。准入票是短时 HMAC，admission key 不进浏览器。
- **engineering.md Redline 6**：服务端专用的引用不得进入浏览器 bundle，由 `check-client-bundle.mjs` 检查。HMAC 只在服务端。
- **ui.md Redline 1**：不加设计值，大厅用现有组件和 token；真缺 token 就停下问人。
- **operations.md**：
  - 不需要新的云资源；
  - 网站已有 `MULTIPLAYER_URL` 和 `MULTIPLAYER_ADMISSION_KEY`，不新增生产环境变量；
  - 验收只用本地服务和本地数据库。
