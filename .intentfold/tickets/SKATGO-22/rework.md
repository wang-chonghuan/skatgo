# SKATGO-22 Rework：SkatZero 正式接入交接

记录日期：2026-09-27。读者：后续正式接入工单的开发者。

## 1. 用户决定与本次变更

用户原话：

> 同意接入skatzero，你把你这个工单里接入skatzero的方法，踩的坑，经验教训以及其他你想说的，都写到rework里，目的是以后正式接入工单可以看了就马上接入。写完你就可以关工单了

决定：采用 **SkatZero** 作为接入方向，授权本次补齐交接文档后合并、关闭
SKATGO-22。本次仍是离线评测 chore，不实施产品接入，不新增依赖，不部署，
不操作 Azure、Render、DNS 或生产数据。

第一份交付冻结在 `8b434bdc68e657d4076d8a3ba358d94c9fe5de4b`。
[handoff.md](handoff.md) 不改写；本文件是其补充，不回写旧实验结论。
相对第一次 handoff，本轮仅新增本文。合并时吸收的其他工单变更不是本单实现。

**不要把“同意选型”解释成已经交付了可直接安装的 TS SDK。** 本单已验证 ONNX
能在 Node 中运行；完整 TS 编码器、策略、房间异步接入及生产容量仍待正式工单实现。
以下明确区分已执行事实、源码契约和建议实现。

## 2. 开工入口与材料位置

建议按这个顺序读：

1. 本文第 3、4 节，确定实际接入位置和正式工单边界。
2. [provenance.json](provenance.json)，固定源码、权重及运行时。
3. 本文第 5 至 8 节，对照参考源码完成编码器和各阶段策略。
4. 第 9、10 节，先通过差分验证再接房间，不先跑大规模棋力赛。
5. [report.md](report.md)、[methodology.md](methodology.md)，理解选型证据的适用范围。

### 长期证据

[evidence.json](evidence.json) 是归档定位和校验的机器可读入口：

```text
文件：skatgo-22-evidence.tar.gz
大小：2,106,724 bytes
条目：183
SHA-256：7606e72bb1c344ba55f637bba0a054f502c90f55ecc1bc0d1abaee1d2dcec99e
Plane asset：b10928b7-e268-494e-920f-0e46d06a5c45
https://api.plane.so/api/assets/v2/workspaces/intentmill/b10928b7-e268-494e-920f-0e46d06a5c45/
```

该归档在 handoff 前已经上传并重新下载，大小和哈希一致。它含精确实验脚本、
输入、原始输出、失败日志、JSkat 临时补丁及许可文本，**不含模型、完整源码树、
虚拟环境或凭证**。不要把即将删除的 ticket worktree 当作唯一材料来源。
Plane 的上述入口供登录会话访问；命令行取文件按 n-plane 的 asset 下载流程，
临时签名下载地址不能成为长期引用。

本机关闭时把整个实验 `tmp/` 移到主 checkout 的：

```text
.intentfold/tmp/SKATGO-22/benchmark/
```

其中 `sources/`、模型、原始 `results/` 可复用。迁移后的 venv、Gradle 缓存和执行
记录可能含旧绝对路径，**保留不等于可原样运行**；需要时按固定版本重建运行时。
正式代码不能依赖这个本机缓存。长期复现用归档、源码 commit 和权重哈希。

### 重要文件索引

以下路径以归档解压目录或本机 `benchmark/` 为根：

| 文件 | 用途与边界 |
| --- | --- |
| `parity.mjs` | 已跑通的 Node ONNX 加载、张量构造、误差检查和计时 |
| `parity.py` | 捕获 SkatZero 原编码器产生的模型输入和 Python 输出 |
| `results/python-parity.json` | 金样张量：逐输入的 dtype、dims、data 和对应输出 |
| `results/node-parity.json` | 同输入 Node 结果；不是完整 TS 编码器验证 |
| `phases.py`、`results/skatzero-phases.json` | 真正调用上游叫牌、Hand 选择、埋牌定约算法 |
| `position_audit.py`、对应 `results/` | `pos` 在出牌和埋牌阶段是否生效的实际审计 |
| `run.py`、`launch.py`、`suite.py` | 有界、去凭证的实验启动和固定样本比赛 |
| `analyze.py`、`results/summary.json` | 配对 board 级统计，不把每局当独立样本 |
| `patches/jskat-experiment.patch` | 比较候选的历史身份修复；不是 SkatZero 接入依赖 |

`python-parity.json` 的 `sample.model` 是原机器的绝对路径。回放时按
`D_0.onnx` 至 `N_2.onnx` 文件名重定位到已校验的模型目录，不按原路径查找。
只做 SkatZero 不必安装 Java、编译 arena 或下载 JSkat 模型。

## 3. 选型、固定版本与运行方式

### 已验证的依据

固定定约、固定埋牌后的主试验共 3,240 局；SkatKlar 补充 108 局。
SkatZero 对原 Skatgo 基线的主指标差为 +5.3370 分/局，
近似 95% 区间为 [3.2810, 7.3931]；对修正后的 JSkat 是 +0.7315，
区间 [-0.8258, 2.2888]，**没有分出明确胜负**。选择 SkatZero 主要是其
实测响应速度、Node 可行性和较小的运行时复杂度，不是宣称棋力绝对第一。

SkatZero 完整出牌 callback 的 p50/p95 是 0.526/1.035 ms；这是 Mac 上
Python 驱动、协议和模型合计的固定定约测量，不能写成 Render 延迟，也不能拿
Node graph-only 的约 0.2 ms 冒充完整线上响应时间。叫牌是另一量级，见第 8 节。
当前维护信息见 seed SKATGO-21；固定源码日期为 2025-06-19，属于低频维护。
后续应由项目自己维护适配器、金样和模型 pin，不假设上游提供稳定 TS API。

### 固定材料

```text
SkatZero:
  https://github.com/Jimboom7/SkatZero.git
  1fe5cabbd5f9c3e77ab51714b0ac702e5a71e53b
评测驱动参考:
  https://github.com/honkphluxx/skat-ai.git
  8cd77cd59899b96d29f204e2f06645619899ef9a
  tools/skatzero-bot.py
实测:
  Node 24.16.0 / onnxruntime-node 1.30.0
  Python 3.12.13 / numpy 2.5.3 / onnxruntime 1.30.0
```

SkatZero 仓库自带九个 `models/onnx/{D,G,N}_{0,1,2}.onnx`，逐文件哈希见
`provenance.json`，勿重新手抄一份清单。约 52 MiB 是文件总量，不是运行内存预算。
完整叫牌还依赖 `bidding/data/` 的八个 `.npy` 表，哈希也已记录。
上游源码为 MIT；复制代码与分发资产时保留许可、来源、版本及修改说明，
并在正式工单核对分发材料的许可范围。本评测不是商业许可审查。

### 建议正式路线

在独立的 `multiplayer/` Node 服务中增加 **TS 编码器 + TS 策略 + 常驻 CPU
ONNX session**。只保留需要的预训练 ONNX 和表数据，不部署训练代码、`.pth`、
PyTorch 或 Java arena。模型在构建期固定、校验，不能每次出牌在线下载。

模型及 session 按 `(gametype, relativeRole)` 选择，共九种；进程/有界 worker 池
复用，不能每个房间各加载九套，也不能每次出牌重新 `create()`。worker 数和线程数
先少后测；九模型文件小不代表高并发天然免费。

Python 参考实现保留为离线差分 oracle，不必成为生产 sidecar。浏览器的
`onnxruntime-web` 是另一条未验证路线；`onnxruntime-node` 绝不能进入课程客户端或
共享纯规则模块。引入实际依赖、构建资产与部署改变仍须在正式工单记录并遵守 Charter。

## 4. 接到当前代码哪里

本节按当前 main 已合入的 SKATGO-20 多人后端编写，首次评测的旧基线没有这些文件。
正式开发时重新读取 [multiplayer/README.md](../../../multiplayer/README.md)
和现行 Charter，不以本文替代当前协议。

| 当前入口 | 接入时的含义 |
| --- | --- |
| `multiplayer/src/model.ts: computerMove()` | 现为同步 AI 总入口；分发 bidding、skat、declare、play、trickEnd |
| `model.ts: applyAction()` | 复用实际 bid/hold/pass、pickup、hand、discard、declare、play 验证 |
| `model.ts: publicView()/privateView()` | 构造单座位 AI 输入的现成信息边界 |
| `multiplayer/src/room.ts: advance()/enqueue()` | 当前定时推进与房间串行化位置 |
| `multiplayer/src/store.ts: change()` | 持 `SELECT ... FOR UPDATE`，校验领导代次，持久化并增加 revision |
| `app/src/lib/skat/game.ts`、`cards.ts`、`value.ts` | 合法动作、轮次、墩赢家、结算仍由原规则引擎裁判 |
| `app/src/lib/skat/ai.ts` | 既控制现有电脑玩家又生成教学理由，不能整体盲替换 |

当前 `skat` 阶段的 `aiDeclare()` 可以把取底牌、埋牌、定约合在一个同步推进中。
新的完整策略应把拟议动作映射到已有阶段与验证函数，不能靠模型直接返回新 `Game`
绕开规则。`trickEnd` 仍是收墩规则动作，不需要神经网络。

### 异步接入设计建议，尚未实现

不能只把 `computerMove()` 改成 `await session.run()` 放回现有事务。
完整叫牌约秒级甚至更长；推理不得持数据库行锁，也不能在房间串行队列里等完整
计算结束，否则同房重连、断线和命令不能及时处理。

1. 在短串行步骤中确认轮到 AI，获取不可变的座位可见输入，登记一个 pending job。
   保存 `roomId/revision/actor/phase/autopilot`、领导代次、模型/策略版本和随机种子。
   输入是 public 信息加该座位自己的 private 信息，不是 `Game` 或 `Snapshot`。
2. 离开房间队列和数据库事务，在有界计算池执行。每个房间至多一个对应当前状态
   的待提交 job；避免定时器反复启动同一轮。设置队列上限、时限与错误观测。
3. 完成后重新入队，在 `store.change()` 内重新读权威快照并检查上述状态。
   人已重连恢复控制、revision 变了、换轮、过期、进程失去所有权等均丢弃旧结果。
   不因“只是连接状态变化”就默认复用旧 AI 动作。
4. 用现有规则验证动作，成功持久化后才 publish。非法、NaN、模型错误应明确失败，
   不能偷偷调用旧启发式后仍记作 SkatZero。若产品需要降级，必须另有显式策略和标记。
5. 进程关闭取消/丢弃 pending 结果；新 owner 依据已持久化状态重新调度。
   保留现有 epoch fencing、30 秒掉线宽限、恢复人类控制、24 小时过期和命令幂等。

普通 async 函数不自动解决 TS 编码和叫牌循环的 CPU 占用；需要实际验证事件循环
延迟并决定 worker 隔离。也不要把存有凭证/全部手牌的对象闭包传给 worker。
缓存叫牌估值若存在，key 必须含全部相关可见输入和策略版本，不能只按房间号。

正式工单应明确选择：

- **完整 AI**：叫牌、取底牌/Hand、埋牌定约、出牌全接入，覆盖各阶段验收。
- **仅出牌的明确混合方案**：其余阶段继续现有 AI，并明确命名与覆盖，不声称完整 SkatZero。

同时明确先服务多人房间还是也改浏览器单人课程。本建议优先多人 Node 服务；
本次用户批准方向不等于默许把单人课程改成依赖远端服务。

## 5. Node 推理契约

### 输入输出

全部是 `float32`。`B` 为**本次合法候选动作数**，不是房间数或固定 32。

| 模型 | `obs` | `history` | `actions` | `output` |
| --- | --- | --- | --- | --- |
| `D_0/G_0` | `[B,555]` | `[B,10,105]` | `[B,32]` | `[B]` |
| `D_1/D_2/G_1/G_2` | `[B,573]` | `[B,10,105]` | `[B,32]` | `[B]` |
| `N_0` | `[B,314]` | `[B,10,105]` | `[B,32]` | `[B]` |
| `N_1/N_2` | `[B,364]` | `[B,10,105]` | `[B,32]` | `[B]` |

同一状态的 `obs/history` 沿 batch 重复，每行换一个候选动作编码。
输出是一维 `[B]`，**不是 `[B,1]`，也不是固定 32 类概率**。
argmax 得到候选行号，要映射回原候选动作，再逆花色映射成产品 `Card`。
候选数、维度、有限值、模型名和动作映射都应显式断言。

以下只是推理边界示意，`encoded` 必须由经过差分验证的编码器提供，
不是本单交付的适配器：

```ts
import * as ort from 'onnxruntime-node'

const session = await ort.InferenceSession.create(modelPath, {
  executionProviders: ['cpu'],
  intraOpNumThreads: 1,
  interOpNumThreads: 1,
})
const feeds = {
  obs: new ort.Tensor('float32', encoded.obs, [B, obsWidth]),
  history: new ort.Tensor('float32', encoded.history, [B, 10, 105]),
  actions: new ort.Tensor('float32', encoded.actions, [B, 32]),
}
const outputs = await session.run(feeds)
const values = outputs.output
// Validate shape, finite values and legal candidate mapping before selection.
// Reuse the session for subsequent decisions; release on pool/process shutdown.
```

`encoded.*` 是连续 `Float32Array`。启动检查九张图及输入输出元数据，预热后再接 AI
请求，关闭时 `await session.release()`。只有一张合法牌时可直接选择，但 lookahead
需要其真实 value，不能把“强制动作”的占位分值当网络估值。

官方 API 文档已通过 Context7 查询 `/microsoft/onnxruntime` 的
`InferenceSession`、`SessionOptions`、`Tensor`。它确认 API 形状；索引结果不是
本次 1.30.0 的运行证明。运行证明是归档中的实际 Node/Python 输出。

## 6. 特征编码：必须逐项对齐

权威实现是固定 SkatZero commit 下：

```text
skatzero/env/feature_transformations.py
  extract_state, get_card_encoding, get_soloplayer_features, get_opponent_features
  process_action_seq, calculate_missing_cards, convert_card_to_action_id
skatzero/env/skat.py
  get_legal_actions
skatzero/test/utils.py
  construct_state_from_history, available_actions
skatzero/evaluation/utils.py
  swap_colors, swap_bids
skatzero/game/utils.py
  card_ranks, init_32_deck, compare_cards, calculate_max_bids
api.py
  prepare_state_for_cardplay, parse_bid
```

`test/utils.py` 中列出的函数也被上游运行入口直接调用，因此这里引用的是编码/
运行契约，不是从测试断言反推产品规则。产品合法性仍以 Skatgo 为准。

### 座位、牌与两层花色映射

- `relativeSeat = (absoluteSeat - declarer + 3) % 3`。角色 0 永远是庄家，
  1、2 是其后按出牌顺序的两位防守者，不是当前先手、庄家的队友或 dealer。
  `self/soloplayer/trace/played_cards/bids/bid_jacks` 全部使用同一相对坐标。
- 产品 rank `'10'` 对应上游 `'T'`。特征列 rank 顺序为
  `7,8,9,Q,K,T,A,J`，**Null 也不改成吃墩强弱顺序**。
- 四个花色定约统一喂 `D` 模型：交换原 trump 与 D 的**非 J** 花色。
  当前手牌、已知 skat、历史、对应的叫牌花色都要一致交换，结果再逆变换。
  J 在 Suit/Grand 中按 C、S、H、D 的固定顺序编码，不因 trump 交换。
- Grand 的 raw `trump='J'`；Null 为 `null`/Python `None`。
- 在上述归一化之后，编码器还有**按当前状态重新排序花色**的一层，
  不能只做 trump 换 D 就结束。初始 tie 顺序是 **D,H,S,C**，稳定降序：

```text
Suit/Grand:
  score(suit) = 100 * ownNonJackCount - 10 * unseenNonJackCount
                + indicator(ownAce)
  Suit 的 D 额外固定为 10000。
Null:
  score(suit) = 100 * ownSuitCount - 10 * unseenSuitCount
                - indicator(own7)
```

Null 的 J 使用这个动态花色表；其他定约的 J 使用固定 C,S,H,D。
Python 原版 `jack_encoding` 是可变全局对象；TS 并发实现不要共享一个被每次调用
改写的全局表，应将两套映射放入单次编码上下文。

### 可见牌、历史和分数

`others_hand` 的含义是 `全 32 张 - 当前自己手牌 - 所有公开已出牌 - 自己已知 skat`。
它是未见牌集合，**不是两位对手的真实手牌**，防守者还包含未知 skat。
不要读取完整 `Game.hands` 生成它，也不要为了“更聪明”暗改其集合语义；
Null Ouvert 的公开庄家牌有独立特征。

`trace` 是已经发生的全部公开出牌，含本墩一张/两张，保留每张牌真实相对玩家。
`played_cards` 按相对玩家聚合。不能把第几个出牌的人当绝对座位；
上一个墩赢家变化后，历史身份仍必须正确。

每条历史是玩家 one-hot 3 + 牌 one-hot 32，共 35 位。`process_action_seq`：

1. 本墩只有一张时，末尾补 `(self, empty)`、`((self+1)%3, empty)`；
   本墩有两张时补 `(self, empty)`。占位牌为零，但玩家位保留。
2. 左边补 `(-1, empty)` 到总计 30 条；这类占位玩家和牌均为零。
3. 最终 reshape 为 `10 x 105`，不是向模型输入 `30 x 35`。

`points` raw 顺序始终是 `[庄家, 防守方]`；角色编码器再转换成己方/对方。
取过底牌的庄家已知埋牌分，从该分开始累计；防守者和 Hand 庄家只从 0 累计公开墩，
不能读取结算用的隐藏 skat 分数。不要在未收墩状态提前计分，lookahead 模拟除外。

### `obs` 拼接顺序

下表每个牌集合/单牌字段宽 32，points 各 121，bid/bidJacks 各 5；
缺失牌是全零，**数值 0 的 one-hot 不是全零**。
`blind_hand/open_hand/drueck` 各 1，`pos` 为 3。

| 角色 | 按顺序拼接 |
| --- | --- |
| Suit/Grand 庄家 | currentHand, othersHand, trick1, trick2, skat, missingLeft, playedLeft, missingRight, playedRight, pointsOwn, pointsOpp, drueck, pos, bidLeft, bidRight, bidJacksLeft, bidJacksRight, blindHand |
| Null 庄家 | 前述九个 32 位字段, bidLeft, bidRight, bidJacksLeft, bidJacksRight, blindHand, openHand, drueck, pos |
| Suit/Grand 防守者 | currentHand, othersHand, trick1, trick2, missingSolo, playedSolo, missingTeammate, playedTeammate, lastSoloAction, lastTeammateAction, pointsOwn, pointsOpp, bidTeammate, bidJacksTeammate, blindHand |
| Null 防守者 | 前述十个 32 位字段, soloOpenCards, bidTeammate, bidJacksTeammate, blindHand, openHand |

防守者 `teammate=3-self`。`last*Action` 是从整个 trace 倒序找到该玩家最近一张，
不是仅看当前墩。庄家 skat 特征只在非 Hand 且确实知道两张时填充。

`calculate_missing_cards` 编码的是公开跟牌暴露的缺门/缺 trump，
不能简单改成“没跟相同花色”；J、Grand、Null 都不同。
`parse_bid` 也不是通用规则求解器，而是训练侧定义的叫牌提示：
按其分组、`bid_jacks` 推断和角色排除逻辑逐项移植并做 fixture，
不要把当前赢得的 bid 填到所有玩家。这里对历史 bid 含义的映射需要正式验收；
固定定约驱动把这些特征清零，**本次比赛没有验证真实叫牌历史特征**。

### `pos` 与埋牌

`api.py` 从原始前/中/后手位置设置 `pos=(3-positionFromForehand)%3`；
不要与“相对庄家座位”或“当前墩先手”混为一谈。
`pos` 只在 `drueck=true` 时写入庄家 obs；出牌 `drueck=false` 时该 3 位全零。
实测 18 个定约/角色 fixture，各切换三种 pos，出牌特征和 ONNX 输出完全相同；
六个埋牌正对照确实改变特征。所以评测驱动的变动 leader-pos 没污染出牌试验，
但不能照搬到真实埋牌；其 `discard()` 硬编码 pos=0 不是通用实现。

12 张手牌时，合法候选是按原手牌顺序枚举的 66 对不同牌。`actions` 每行是
两张牌的 two-hot 32；compound action id 为 `(id(first)+1)*100+id(second)`。
不要把它当 32 类索引。动作顺序和相等 value 时选首个候选的行为要稳定，
否则同一模型也会产生不同策略。

## 7. 出牌不是只有 argmax

实测比赛走 `tools/skatzero-bot.py: Driver.choose/evaluate`。它除了基础网络，
还复现了上游一步 lookahead：

1. 非 Null，本次是本墩第三张且自己手牌多于一张。
2. 对能让**自己**赢墩的候选，模拟出该牌、收此墩、增加己方 points，
   更新自己的手牌和公开 trace，然后以自己下一墩先手的最大 value 评价此候选。
3. 没让自己赢墩的候选保留即时 value；按稳定顺序选最大者。

漏掉这一步仍可产出合法牌，但不再是本次测量的策略。模拟仅需自己的手牌与公开
历史，不许读取隐藏手牌或用全知 rollout。复用 Skatgo 的吃墩/点数规则；
不要把评测驱动另写的一套 `trick_winner` 复制成产品的第二套裁判。

原 `api.cardplay()` 会打印候选，还可能先打印一张初选牌、递归后再打印最终牌，
且展示分值有四舍五入。正式调用应返回类型化结果，用未截断值选择；
不能读 stdout 第一行或把展示用精度当策略输入。`phases.py` 为隔离 PyTorch
曾用 AST 替换 loader，这是一次性实验手法，**不要带进产品启动流程**。

## 8. 完整叫牌、Hand 与定约

### 不能直接复用的驱动行为

arena 驱动 `MAXBID` 永远返回 0，`HANDGAME` 固定返回 pickup/Grand。
所以“驱动跑通固定定约”不代表会叫牌、会自主决定 Hand。
它的简单 `discard()` 也不等价于完整 API 的按中标价择约。

真实入口与依赖：

```text
api.py: bid, get_max_bid, declare
bidding/bidder.py: Bidder
bidding/bidder_simulated_data.py: SimulatedDataBidder
bidding/data/{values,outcome_distributions}_{D,G,DH,GH}.npy
skatzero/game/utils.py: calculate_max_bids
```

`Bidder` 在未知的 22 张牌中枚举/打乱 231 种可能 skat，评估 pickup 后各定约与
66 对埋牌；另算 Hand 值。全部输入必须来自未知集合的模拟，不是真实底牌。
位置影响对首轮出牌的模拟；上游代码存在注释与切片数量不一致，移植时以实际
执行表达式和差分结果为准，不能看注释后另写一套近似算法。

`SimulatedDataBidder` 用模型 reward、matadors/可叫分和 outcome 表形成叫牌值表，
含 Hand、Schneider、Schwarz、过叫及 Null 的处理。迁移表数据时：

- 原始 `outcome_distributions` 是 `[n,m,6]`，先对 m 求均值得 `[n,6]`。
- `load_data()` 两端加极端 values/distributions，之后用 `np.interp` 的语义插值。
- 可在构建期导出确定性 JSON/二进制，附输入哈希、生成器和对照测试；
  不必为读 `.npy` 在生产引入 Python。
- 文件末尾的 JS 打印辅助会把数字格式化为三位小数；不要把这种展示输出当无损转换。
- 叫牌惩罚、阈值、样本顺序、早停 hotfix 都是策略的一部分；调整后要换策略版本、
  重新记录比较，不能声称与本次固定版本相同。

上游默认 `accuracy=231`、`bid_threshold=-5`，循环有 60 秒 cap。
**60 秒并不是整个请求的硬超时**：Hand 估值在计时开始前，循环后还有表计算。
正式运行必须限制整个任务，观察取消是否真释放计算资源，不能只包 Promise 超时。

上游 `get_max_bid()` 可返回 17 这个特殊值；产品协议是 bid/hold/pass，不收任意整数。
需要按当前叫牌角色、报价阶梯、是否承诺 18 等语义显式转换，核对两边的报价集合，
不能把 17 当合法报价，也不能无脑向上取整。获胜价参与 pickup/Hand 和定约选择；
不要丢掉该信息后只选网络最高的牌型。

### 已完成的阶段 smoke

```text
hand = CJ,DJ,DA,DK,DQ,D7,C9,HA,HT,HK
position = 0
seed = 202609270
accuracy = 231
bid_threshold = -5
winningBid = 18（后两个调用）

BID                         -> 72          约 1.293 s
SKAT_OR_HAND_DECL            -> GH          约 1.272 s
DISCARD_AND_DECL（加 CT,ST）  -> G.CT.ST     约 9.089 ms
```

这些是三个独立调用，后两个是不同选择分支，不是“一局既 Hand 又取底牌”。
这是每阶段一份 fixture，不是延迟分布、叫牌强度证明或完整全局策略验收。
取得 `GH/NHO/NO...` 等返回值时，应转换成产品的结构化 declaration 和阶段动作，
不把协议文本直接塞入 `Game`。

Hand/Ouvert 比赛没有跑；Suit/Grand 的 announced Schneider/Schwarz/Ouvert 也不能
凭模型字段自行声称覆盖。正式工单要逐变体核对训练/策略能力和产品支持范围；
不支持项明确拒绝或采用经批准的方案，不得静默去掉声明旗标。

## 9. 最短复现路径与验收顺序

### 先回放九张图，不重跑三千局

在新工单的 ignored scratch 解压证据、校验归档，固定 SkatZero 源码和九个模型。
仅在 scratch 安装 `onnxruntime-node@1.30.0`，不要顺手改 `app/package.json`。
参考 `parity.mjs` 建独立回放器：

1. 读取保存的 `python-parity.json`，筛选路径包含 `sources/skatzero/models/onnx/`
   的九个 sample；断言恰好覆盖 D/G/N x 0/1/2。
2. 按 basename 重定位模型并校验 `provenance.json`，保持全部 `feeds` 原样。
3. 检查输出 shape、元素个数、有限值；对每元素比较误差并检查 argmax 映射。
   原回放阈值为 `1e-5 + 1e-4*abs(reference)`，本机实测 max error=0。
4. 把结果写到**新的**输出位置，别覆盖原始金样。

这条路线不需要 JSkat 或 Python。在不同架构/ORT 版本上不能预设逐位一致；
保留原容差，不因新结果不通过就放宽。跨平台差异要定位后决定是否接受。

需要重跑实际 SkatZero 阶段 smoke 时，按 [reproduce.md](reproduce.md) 建好
SkatZero/skat-ai 两个固定源码目录及 Python 环境。以下从新 ticket checkout 根运行，
`E` 是新的、保持标准 ticket 深度的解压目录，原 `results/` 已另存后再建空目录：

```sh
E="$PWD/.intentfold/tickets/<new-ticket-id>/tmp"
P="$E/runtime/venv/bin/python"
"$P" "$E/run.py" --name skatzero-phases --timeout 300 -- "$P" "$E/phases.py"
"$P" "$E/run.py" --name skatzero-position-audit -- "$P" "$E/position_audit.py"
```

`<new-ticket-id>` 需替换；完整依赖版本见第 3 节。`run.py` 给子进程去掉应用凭证、
设置 `SKATKLAR_SKATZERO_DIR`，这两项不依赖 Java；一旦路径搬离 ticket 的标准层级，
基线 `jiti` 路径等要另行定位。旧 `parity.py/models.py` 会遍历比较候选，不能声称
不下载 JSkat 也能原样跑其全套命令。仅 SkatZero 用筛选后的独立回放。

### 正式工单建议完成顺序

1. 固定许可、模型 manifest、版本与 API 边界；明确完整阶段还是显式混合方案。
2. 实现纯函数 seat-view 构造与 TS 编码器，先逐元素对 Python 金样。
   九张图的现有金样只覆盖开局；增加中后盘、部分墩、缺门、真实 bids、
   12 张埋牌与公开手牌 fixture，并保存原始可见输入。
3. 接常驻 Node session，验证合法候选映射、每张图、不同 B、NaN/缺文件/坏哈希拒绝。
   再对比完整出牌策略，包括会改变选择的一步 lookahead。
4. 若范围是完整 AI，移植 Bidder 和表数据，逐阶段差分，覆盖所有位置、
   17/18 边界、最高报价、过叫、Hand/pickup 和定约旗标。
5. 接房间异步生命周期，用真实 SDK 与隔离本地 PostgreSQL 验证恢复/并发。
6. 做约定样本的自然叫牌整局对照，再量目标 Linux 容器并发/内存/延迟。
   只有新证据才能回答“完整棋力”和“生产容量”。

### 可直接转成正式 AC 的清单

- TS 与固定 Python 对同一可见状态的 obs/history/actions 逐元素一致；
  原牌、归一化牌、action row 的往返映射一致，全部三个座位轮换覆盖。
- 开局、中盘、末盘、J 领出/垫牌、Null rank、空历史/部分墩/换先手、
  12 张埋牌、score 0、未知 skat、Hand/Ouvert 均有适用的 fixture。
- 保持可见输入与种子相同，只改变不可见分配，张量/输出不变；
  覆盖后来历史，不只开局；AI worker 实际收到的序列化消息也不含隐藏牌。
- 每个模型提议都经产品规则验证；非法/异常/超时计数，无静默替代；
  故障路径会释放池容量，房间不产生重复推进。
- AI 思考时重连、断线宽限到期、room expiry、revision 变化、进程重启和
  leadership 转移均不会提交过时结果；始终先持久化再广播。
- 一至三名真人配置、空位 AI、临时接管和恢复人类控制均通过 SDK 验收。
- `onnxruntime-node` 不出现在客户端依赖图；课程/规则/教学提示边界不被意外改变。
- 如将神经动作展示给学习者，不附上解释另一张牌的旧启发式理由；
  网络 value 不标作校准胜率或自然语言原因。
- 分别记录冷启动、队列等待、编码、推理、叫牌全任务和端到端 p50/p95/max，
  记录样本量、线程/worker/并发、实际进程 RSS 和超时。
- 跑当前 Charter 的全部机械防线；部署另需授权及真实线上版本/readiness 核验。

这些是后续工单候选 AC，不声称本 chore 已完成上述产品接入验证。

## 10. 踩坑与经验

| 坑 | 本次发现/处理 | 正式接入应保留的教训 |
| --- | --- | --- |
| 模型能跑、动作合法就以为编码正确 | 原 JSkat 历史审计 9 张有 6 张玩家身份错误，原 36 局 smoke 排除；`Trick.getCard(Player)` 参数实际是墩内位置 | 必须用换先手历史对照真实 feature builder；自对照也可能让同一个 bug 在两边互相抵消 |
| 把修正 fork 写成 stock JSkat | 固定 fork 再加临时 history 修复和线程配置才进入正式比较 | 别丢 patch/provenance；对 SkatZero 也记录策略修改而非只写模型版本 |
| 看到 `pos` 不一致就判定结果无效 | 实际编码器出牌不读 pos，18x3 对照和六个埋牌正对照确认 | 以可失败实验判断影响；出牌无影响不代表埋牌可照抄 |
| 外部 arena 默认“诚实”统计 | 驱动 STATS 自报 0 并未做扰动，本单另跑了隐藏分配对照 | 不能把框架自述当安全证据；输入边界本身要隔离 |
| 14 张图 Node/Python 一致就叫 TS 接入完成 | 实际是同一组已经编码好的张量 | runtime parity、encoder parity、policy parity 是三个不同问题 |
| 固定定约驱动当完整 AI | MAXBID=0、Hand 固定，真实 API 另做 smoke | 出牌选择、叫牌和定约需要分别接入、验收 |
| 随机强制定约成绩等于整局实力 | 主试验在埋牌之后强制定约，可能给玩家必输牌；未比较自然叫牌 | 不给出 Elo/人类胜率或完整棋力排名 |
| 比分只看点估计 | SkatZero/JSkat 主区间跨 0，补充 SkatKlar 样本小也跨 0 | 不转挑次指标宣布胜负，不因结果不好临时缩样本 |
| 只看 SkatKlar 中位数 | p50 很低但 p95 约 1.444 s，max 约 22.676 s | 高并发预算由尾延迟、队列和整个策略成本决定 |
| 把整个实验进程树 RSS 当单模型内存 | 测量包含 arena、双方玩家及 helpers，且半秒采样 | 生产容量重新在目标运行时实测，不能按旧数字配 Render |
| 相对路径因 cwd 改变失效 | position audit 首次启动失败，换绝对 T/P 后通过 | 新进程明确 cwd、绝对资产路径；保留失败证据，不计成对局失败或成功 |
| 临时 Java probe 漏编译 classpath | 首次编译失败，修正后单独记录 | SkatZero 接入不必带入评测基础设施的构建复杂度 |
| 把 scratch 当长期成果 | 原归档已上传、回读校验；本次关闭前搬走本机材料 | 正式代码依赖固定资产，不依赖已删除的 worktree 或本机 venv |

本次 3,348 局正式比赛没有检测到非法动作、provider 错误、替代或超时，
360 局同玩家对照、432 次隐藏牌对照通过。但隐藏检查仅开局，Hand/Ouvert、
TS 编码器、线上房间竞争、Linux 原生性能没有因此自动通过。

## 11. 本轮复核与关闭记录

本轮以冻结 handoff、原始结果、固定参考源码及当前 multiplayer 运行入口核对本文。
不重跑已经交付的棋力赛，不新增/改写其结果，不更改 `ticket.json` 中第一交付的
事实。正式合并、关闭与清理结果由 Plane 关闭评论记录。

本轮 rebase 到 `5e6b2dc`（已含 SKATGO-20 多人后端及 SKATGO-19 token 检查），
无冲突。最终分支实际执行结果：

- 现行 `engineering.md` 的完整前端机械命令通过：typecheck、生产 build、
  6 文件 67 项测试、12 个客户端 chunk 无 server-only 引用、52 个源文件的
  design-token 检查、literal grep 为 0、SSR 模块成功链接。
- `TEST_PORT=56022 npm --prefix multiplayer run check` 通过：
  typecheck、build、12 项真实 SDK/PostgreSQL 测试，约 41.6 秒，
  包含真实 30 秒断线宽限、重连、进程恢复、持久化与 fencing。
  这验证的是吸收后的现有后端，不是尚未实现的 SkatZero 房间接入。
- 自动核对本文相对文档链接均存在；九组保存金样的 dtype/shape 与本文一致；
  九个模型及八张表的大小、SHA-256 全部匹配 `provenance.json`。
- 与原 handoff commit 比较，旧八份 ticket 文件内容完全不变，仅新增本文。
  与最新远端 main 比较，仅九份本工单文档/结果文件，无产品或 lockfile diff。

默认 Colima 本地磁盘满，首次新建数据库以 `No space left on device` 失败；
没有在该环境启动验收。随后启动项目已有但已停止的 `skatgo` profile，
不切换默认 Docker context，使用 `colima-skatgo` 的本单隔离端口 57022 成功验收。
测试只生成本地 `multiplayer/.env`，不读取或同步生产配置，不改主 checkout 的
环境文件；关闭时停止并清理本次启动的本地资源。实际清理结果见 Plane 关闭评论。

构建仍报告已有的 native-config-loader 与大 chunk 警告；`npm ci` 对未改动的
前端锁文件报告 2 moderate、1 high 审计项。本单未执行 audit fix、改依赖或削弱检查。
本轮没有重跑比赛、调用付费模型、发起生产请求或部署。
