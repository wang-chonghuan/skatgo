# SKATGO-87 plan

## 代码里有、工单没写的

- **规则引擎**（`app/src/lib/skat/game.ts`）：
  - `Move` 里的 bid 只有 `value: 'bid' | 'hold' | 'pass'`，`bidAction` 遇到 `'bid'` 一律取 `nextBid(b.value)`；
  - `applyMove` 校验的是「这一刻该说的那个词」；
  - 叫牌记录 `BidEvent.value` 存的是实际报出的数，所以显示和 `auctionOf` 都直接认这个数。
- **multiplayer**（`src/model.ts`）：`actionSchema` 用 zod 的 strict 对象校验 bid。每日赛、自由对局、私人牌桌都经过它，必须接受新字段，否则会被拒。
- **电脑**：
  - SkatZero 作为应叫方用 `b.value <= top`，作为报价方只叫下一个值；
  - 启发式电脑（`aiBid`，私人牌桌和提示用）作为应叫方用 `b.value <= limit`。
  - 所以电脑面对任何报出的数都能回答跟或不跟。
- **重放**：每日赛的进行中记录和自由对局的 token 存的是 `Move`。旧的 `{type:'bid', value:'bid'}` 必须仍然表示下一个值。
- **界面**：
  - `game-table.tsx` 的 `ActionsFor` 在报价方这一步是三个大按钮：「{value} sagen」「Passe」「Tipp」，排在 `Row` 里（flex 加换行）。
  - 可复用的药丸样式是 `styles.toggle` 和 `styles.toggleOn`（声明 Schneider 时的开关）。
- **文字**：规则页（`rules/content.{de,en}.ts`）明说「SkatGo 每次叫牌都是下一个值」。

## 路线

1. **引擎**：
   - `Move` 的 bid 加可选 `to?: number`；`bidAction(g, action, to?)` 在报价方 `'bid'` 时取 `to ?? nextBid(b.value)`。
   - `to` 必须在 `BID_LADDER` 里且高于当前值。
   - `applyMove` 只在报价方说 `'bid'` 时接受 `to`，其他时候带 `to` 视为不合法。
   - `game.test.ts` 加测试：跳叫、不合法的跳叫、应叫方对跳叫的跟或不跟、没有 `to` 的旧动作不变。
2. **multiplayer**：`actionSchema` 的 bid 接受可选 `to`（整数）。
3. **界面**（`ActionsFor` 报价方那一支）：
   - 加「Höher …」白色按钮，点开后就地展开一排可左右滑动的值，从下一个值的下一档，一直到规则引擎叫牌表的最高值 264。
   - 点一个值是选中（再点一次取消），主按钮变成「{value} sagen」，`onBid('bid', to)`。
   - 应叫方和两家都 pass 后前手开叫这两步不变。
4. **文字**：`bid_your_turn` 提示可以跳叫；新增 `bid_higher`；规则页那句改成「可以跳过叫牌值」。

## 和工单建议方案的出入

无。
