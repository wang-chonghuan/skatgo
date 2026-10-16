# SKATGO-108 handoff

「Tricks」页面的第一张卡片是「Sieg sichern」天梯：10 道不明牌残局题，从 SkatZero 自己对打的对局中自动生成，每道都有严格证明。Finish 本次为 auto-deploy（人在 grill 中决定）。

## What changed

- **求解和证明** `app/src/lib/skat/tricks/exercises/endgame.ts`
  - 可能的分牌：对手手里剩下的牌按张数分开，再去掉与已暴露缺门（没跟出的花色）矛盾的分法。
  - 唯一稳赢的牌：在所有可能的分牌下都能拿到 61 分的牌只有一张，用 `sureOf` 证明。
  - 陷阱：其他每张合法牌，都给出一种可能的分牌，在这种分牌下即使明牌也到不了 61 分。
  - 推断：在所有可能的分牌里都只在某一家的牌。
  - 稳赢打法：在真实牌局里演示，庄家每一步都选仍然稳赢的牌，对手每一步都选让庄家拿分最少的牌。
- **生成器** `multiplayer/scripts/make-endgames.ts`
  - 重放免费对局池里的 1000 局，每个座位都由 SkatZero 来打。
  - 在「庄家先出、剩 3–5 张、已拿底牌、胜负未定」的局面里共找到 45 道合格题。
  - 按 3/4/5 墩、1/2/3 级挑出 10 道；从第 3 题起，「最显眼的牌」（最大的将牌，没有将牌时取分值最高的牌）必须是陷阱。
  - 输出 `endgames.data.ts`（生成文件，已提交）。
- **题目**
  - `ladder.ts`：从存好的数据建题，浏览器端不做任何计算。
    - 第 1 级：额外列出对手剩余的牌（已排序，看不出谁拿哪张），以及谁缺哪门。
    - 第 2 级：只给出牌记录。
    - 第 3 级：连已有分数也不给。
  - `ladder-text.ts`：德英两种固定句式，用求解器的事实填空：缺门、由此推出的牌在谁手里、只有哪张牌能拿到还差的分。
  - `types.ts`：新增题型 `sieg-sichern`，排在第一位；新增 `history`、`voids` 两种展示行，以及 `need`、`tricksLeft`、`level`、`endgame` 字段。
- **页面**
  - `tricks-exercise-page.tsx`：
    - 出牌记录复用产品里现成的 `TrickReplay`；
    - 缺门一行文字；
    - 局面一行加上「还差几分」和「还剩几墩」；
    - 答完后的分析：对手的牌、稳赢打法（同样用 `TrickReplay`）、陷阱；
    - 「下一题」只在天梯内前进，第 10 题之后回到目录。
  - `tricks-page.tsx`：天梯卡片排第一，阴影加深、绿色边框，显示「n von 10 gelöst」；每行标明第几级、做对的打勾、下一道未做的标「Weiter」。
  - `ladder-progress.ts`：进度只存在浏览器里（键名 `skatgo.ladder.v1`），页面加载完成后才读出来。
- **文案**
  - 新增天梯用的消息文字（德、英）。
  - 题数从 36 改为 46，涉及题库主页的标题、描述、导语，以及首页卡片和课程卡片：原来写的是「36 道 / 12 类」，现在不对了。
- **测试** `exercises.test.ts`：
  - 题型结构：天梯 10 道排第一，其后 12 类各 3 道，共 46 道；
  - 天梯 10 道逐一：整副牌 32 张不重不漏，按规则出牌，每墩赢家正确；
  - 天梯 10 道逐一重新证明，结果必须和存储的分析完全一致。

## 天梯 10 道

| # | 级 | 打法 | 剩几墩 | 已有 / 还差 | 手牌 | 答案 | 陷阱 | 暴露的缺门 |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Grand | 3 | 54 / 7 | D10 D8 S8 | **D10** | D8, S8 | left 无 T（第1墩）; right 无 C（第7墩） |
| 2 | 1 | Pik | 3 | 47 / 14 | H10 CK SK | **H10** | CK, SK | left 无 T（第4墩）; left 无 H（第5墩） |
| 3 | 1 | Kreuz | 3 | 43 / 18 | CA C9 CK | **CK** | CA, C9 | left 无 D（第4墩）; right 无 T（第7墩） |
| 4 | 2 | Grand | 4 | 52 / 9 | S8 CA CQ HJ | **CA** | S8, CQ, HJ | left 无 T（第1墩）; left 无 H（第2墩）; right 无 H（第3墩） |
| 5 | 2 | Karo | 4 | 56 / 5 | D8 H7 DJ H10 | **D8** | H7, DJ, H10 | — |
| 6 | 2 | Pik | 4 | 53 / 8 | D10 SQ S7 SK | **S7** | D10, SQ, SK | — |
| 7 | 2 | Grand | 4 | 47 / 14 | HJ SQ S10 D10 | **S10** | HJ, SQ, D10 | left 无 H（第3墩）; left 无 T（第5墩） |
| 8 | 3 | Pik | 5 | 46 / 15 | CJ CQ C7 C10 SQ | **C10** | CJ, CQ, C7, SQ | — |
| 9 | 3 | Grand | 5 | 58 / 3 | C10 DK SQ CK S8 | **DK** | C10, SQ, CK, S8 | right 无 H（第2墩）; left 无 T（第3墩）; left 无 D（第5墩） |
| 10 | 3 | Pik | 5 | 54 / 7 | SK H9 H8 SA HK | **SK** | H9, H8, SA, HK | right 无 T（第4墩） |

## AC results

在构建版（端口 55108）上用 Playwright 跑 `tmp/ac.mjs`，桌面 1280×820 和手机 375×812 各一遍：

1. **天梯排第一：** 展开后 10 道题依次是 `sieg-sichern-1`…`10`，从「Stufe 1 · noch 3 Stiche」到「Stufe 3 · noch 5 Stiche」；进度显示「0 von 10 gelöst」。✅
2. **三级提示：**
   - 第 1 级（第 3 题）：列出对手剩余的牌和缺门，并有出牌记录；
   - 第 2 级（第 5 题）：只有出牌记录和分数；
   - 第 3 级（第 9 题）：局面一行里没有分数。✅
3. **答题和分析：** 答错（第 9 题）和答对（第 3 题），都显示了对错、推理、对手的牌、稳赢打法和陷阱。答对后主页显示「1 von 10 gelöst」，那一道打了勾。✅
4. **严格证明：** `npm --prefix app run test` 151 项全部通过，其中天梯的 22 项（结构 1 项、10 道题各 2 项）都在内。✅
5. **英文：** 第 10 题英文版标题是「… tricks to go」，答完后分析正常；做完第 10 题，按钮回到目录。✅
6. **机械防线：** 全部通过：typecheck、build、test、client bundle、design tokens、literal grep、SSR import、`check:seo -- --built`、`test:seo` 25/25。另外 multiplayer 的 `npm run check` 22/22 通过。✅

两种视口下都没有控制台报错。

## Deviations

- 第 1 级的「对手剩余的牌」按花色排序展示：原始顺序会暴露哪些牌在左家。
- 首页卡片、课程卡片、主页的题数从 36 改为 46，并在文案里提到残局；原来的数字和「12 类」已经不对了。
- **Charter 没有改**，这是需要人决定的漂移：
  - `product.md` 仍写着「十二类、36 道、无登录、不保存」；
  - `ui.md` 的题库页描述没有提到天梯卡片；
  - `engineering.md` 的结构表没有列出 `endgame.ts`、`ladder*.ts`、`ladder-progress.ts`、`make-endgames.ts`。
  - 要更新的话请人明说。

## Environment

- 端口：web 55108；本地数据库 57108（只在 multiplayer check 时用过，已经停掉）。
- 为了建本地数据库，worktree 里的 `multiplayer/.env` 由脚本重写过，原文件在 `tmp/`；不需要同步回主目录。
- 没有 env 键变更。

## Residual

- **扩充题量：** 现在只用了对局池 1000 局里的 45 道。要更多题，就生成新的牌局（重新发牌、让 SkatZero 叫牌，每局约 3 秒），再跑同一个生成器。
- **以后的功能：** 防守方题、每日一题、连续天数、解题等级分。
