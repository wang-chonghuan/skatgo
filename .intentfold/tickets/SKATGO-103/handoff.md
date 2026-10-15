# SKATGO-103 handoff

Tricks 的题库：`/skat-tricks` 改为 12 个题型的目录卡片（展开 / 折叠），36 道精选题，每题一个答题分析页；原文章移到 `/skat-tricks/12-tricks`；每局结算页的链接改到题库。Finish 本次为 auto-deploy（人在 grill 中决定）。

## What changed

- **题库数据** `app/src/lib/skat/tricks/exercises/`
  - `types.ts`：题、题型、局面、作答方式、核对方式（`Proof` / `Judge`）。
  - `positions.ts`：20 道精确题。答案在载入时由引擎和求解器算出，答案不唯一就直接报错：
    - 叫牌值（`value.ts`）、记牌（整副牌、按规则核对每一张出牌）、概率（组合计数）；
    - 残局 / 还会输吗 / 破 Null ouvert / Null 风险（`solve.ts`）。
  - `judged.ts`：16 道 SkatZero 判断题。局面取自 SkatZero 自己对打的免费对局池，附带它当时看到的全部历史。
  - `solve.ts`：明牌全搜索；庄家看不到防守方的牌时能否保证拿到分数 / 保住 Null（防守方看全部牌，所以「稳」是证明）。
  - `text.de.ts`、`text.en.ts`：题面、选项、讲解。概率的百分数从计算值格式化，不手写。
  - `exercises.test.ts`：12×3、德英齐全、牌不重复、答案合法、记牌整副牌按规则出牌。
- **SkatZero 核对** `multiplayer/test/tricks-exercises.test.ts`（+ `tricks-judge.ts`）：每道判断题必须是 SkatZero 自己的选择，并且比第二选择至少高 10 分；叫牌题要求最高叫价离问的那一叫至少两档。
- **页面**
  - `tricks-page.tsx`：题库目录。12 张卡片，原生 `<details>` 展开 / 折叠，折叠的题目也在服务器 HTML 里；地址带 `#题型` 时自动展开那一张。卡片下方两个小链接：12 条技巧文章、规则。
  - `tricks-exercise-page.tsx`：单题页。顶部是返回按钮和「题型 · 第 n 题」；白卡片里是局面一行、展示的牌、题目。只答一次，答完显示对错、正确答案、讲解、对应技巧，再给「Nächste Aufgabe」/「Noch mal」。
  - `tricks-article-page.tsx`：原文章。每条技巧加了「Üben: …」链接，指向对应题型。
- **练习组件** `exercises.tsx`：`Choice`、`Pick`、`Play` 加了 `once` 模式：
  - 第一次作答即定，答错时标出正确答案；
  - 出了不合规则的牌仍按原来的方式拒绝，不算作答；
  - 课程里的用法不变。
- **路由 / 收录**
  - `routes/skat-tricks.tsx`（题库）、`skat-tricks_.12-tricks.tsx`（文章，带原来的 Article JSON-LD）、`skat-tricks_.$exercise.tsx`（单题，未知题号返回 404）；`paraglide.options.ts` 两个新地址规则。
  - `indexability.ts`：单题页 noindex，文章例外；`sitemap.ts` 加入文章。
  - 新预览图 `og/tricks-exercises-{de,en}.png`，从题库主页的 H1 生成。
  - `scripts/seo-inventory.mjs`：私有动态路由用源码里一个真实的题号抽查（原来用的「sample」对单题页来说是不存在的题号）。这是让检查覆盖新路由，检查本身没有放松。
- **链接**
  - 结算页的「Spielverlauf」链接（每日赛、自由对局、第 11 课共用 `DealAnalysis`）指向题库，文字改为「Interaktive Übungen – spiel besser Skat」/「Interactive drills – play better Skat」，仍在新标签页打开。
  - 首页 Tricks 卡和课程页 Tricks 卡：文字写的是文章，所以链到文章新地址，文字不动。
  - 顶部导航、页脚、牌桌规则面板指向题库。
- **Charter**（人在 grill Q1 批准）：`product.md`、`ui.md`、`engineering.md` 里关于 Skat-Tricks 的描述，按题库 + 文章新地址改写。

## AC results

在构建版（`node .output/server/index.mjs`，端口 55103）上用 Playwright 跑 `tmp/ac.mjs`，桌面 1280×820 和手机 375×812 各一遍，20 项全部通过：

1. **题库主页：** 12 张卡，逐张点开后各露出 3 道题，再点收起；共 36 个不同的题。36 个单题页德、英各打开一遍，均为 200，有题目、有 noindex。✅
2. **答题和分析页：**
   - 选择题故意答错：选项锁定，显示「Richtig ist: 36」、讲解和「Trick 2」链接；
   - 扣牌题选错两张：判错，并给出正确的「♠10 ♠8」；
   - 出牌题出对：判对；
   - 「Nächste Aufgabe」进入下一题，新题未作答；返回按钮回到 `/de/skat-tricks#ausspielen`，该卡已展开；
   - 无需登录，localStorage 没有新增键（只有原来的 `__clerk_environment`）。✅
3. **文章：** `/de/skat-tricks/12-tricks` 和 `/en/skat-tricks/12-tricks` 都有 12 条技巧和 3 个每日赛按钮；题库主页卡片下方的小链接能打开文章；文章里的练习链接指向题型卡片。✅
4. **结算页链接：** 指向 `/skat-tricks`，文字为新的那句（代码和构建产物里都核对过）。按「验收不打牌」的规则，没有打完一局去看结算页，留给你自己测试。✅（代码层面）
5. **题目核对：**
   - app 测试 130 项全过，精确题的答案在载入时算出，不唯一就报错；
   - multiplayer 的 `npm run check` 22 项全过，其中 SkatZero 题库测试 16 题全部满足差距 ≥ 10，最小差距 15.3；
   - 全部 36 题列在下面。✅
6. **牌组：** 在设置里切到德国牌后，题目里的牌显示德国牌面。✅
7. **机械防线：** engineering.md 规定的整套检查全部通过（typecheck、build、test、client bundle、design tokens、literal grep、SSR import、`check:seo -- --built` 48 页、`test:seo` 25 项）。✅

## 全部 36 道题

精确题由引擎或求解器在载入时算出；SkatZero 题的数值是它的估值（游戏分）：答案的值、最好的其他选项的值、两者之差。

| # | 题 | 德文标题 / 题面 | 中文 | 答案 | 核对 |
|---|---|---|---|---|---|
| 1 | `reizen-1` | **Wie hoch geht Kreuz mit zwei Buben?** — Du willst Kreuz spielen. Bis wie viel darfst du höchstens reizen, ohne dich zu überreizen? | 想打梅花（有梅花J、黑桃J，无红心J），最高能叫多少？ | 36 | 引擎：Kreuz, mit 2, Spiel 3: 3 × 12 |
| 2 | `reizen-2` | **Herz ohne den Kreuz-Buben** — Du willst Herz spielen. Bis wie viel darfst du höchstens reizen? | 想打红心（缺梅花J、有黑桃J），最高能叫多少？ | 20 | 引擎：Herz, ohne 1, Spiel 2: 2 × 10 |
| 3 | `reizen-3` | **Zwei Asse, aber nur vier Trümpfe** — Vorhand hat 18 gesagt. Mit Kreuz wärst du „ohne 1, Spiel 2“ – 24 ginge also. Sagst du 20, oder passt du? | 前手叫了18。按梅花算叫牌值够24，但只有4张将牌：跟20还是过？ | Passen（过） | SkatZero：最高叫价 0（连 18 都不叫） |
| 4 | `druecken-1` | **Kreuz ohne Buben: Was kommt in den Skat?** — Du spielst Kreuz. Welche zwei Karten drückst du? | 打梅花（手里没有J），扣哪两张？ | ♠10 ♠8 | SkatZero：答案 65.0，第二选择 44.8，差 20.2 |
| 5 | `druecken-2` | **Grand: König allein, Zehn ohne Ass** — Du spielst Grand. Welche zwei Karten drückst du? | 打 Grand，扣哪两张？ | ♣K ♥10 | SkatZero：答案 24.7，第二选择 -5.2，差 29.8 |
| 6 | `druecken-3` | **Pik: die schwache Farbe weg** — Du spielst Pik. Welche zwei Karten drückst du? | 打黑桃，扣哪两张？ | ♦10 ♦D | SkatZero：答案 24.9，第二选择 -2.0，差 27.0 |
| 7 | `spielwahl-1` | **Zwei Buben und vier Asse** — Du hast den Skat aufgenommen. Welches Spiel sagst du an? | 拿起底牌后：2个J、4个A——打什么？ | G（Grand） | SkatZero：答案 136.2，第二选择 83.4，差 52.8 |
| 8 | `spielwahl-2` | **Lang in Herz** — Du hast den Skat aufgenommen. Welches Spiel sagst du an? | 拿起底牌后：红心长——打什么？ | H（红心） | SkatZero：答案 76.4，第二选择 28.8，差 47.6 |
| 9 | `spielwahl-3` | **Gereizt bis 27 – und ein Null?** — Du hast den Skat aufgenommen. Gereizt ist bis 27. Welches Spiel sagst du an? | 叫到27，牌很小——打什么？（普通Null只值23，会超叫） | NO（Null ouvert） | SkatZero：答案 90.7，第二选择 -37.8，差 128.5 |
| 10 | `anspielen-1` | **Gegen den Grand: das Ass** — Du spielst gegen einen Grand Hand und kommst raus. Welche Karte spielst du? | 防守 Grand Hand，轮到你先出：出哪张？ | ♠A | SkatZero：答案 53.9，第二选择 18.1，差 35.8 |
| 11 | `anspielen-2` | **Welches Ass zuerst?** — Du spielst gegen einen Grand Hand und kommst raus. Welche Karte spielst du? | 防守 Grand Hand：两张A，一张单张，先出哪张？ | ♣A | SkatZero：答案 1.0，第二选择 -16.3，差 17.3 |
| 12 | `anspielen-3` | **Grand Hand: dein Herz-Ass** — Du spielst gegen einen Grand Hand und kommst raus. Welche Karte spielst du? | 防守 Grand Hand：先出哪张？ | ♥A | SkatZero：答案 40.9，第二选择 24.1，差 16.8 |
| 13 | `schmieren-1` | **Partner sticht mit dem Buben** — Du bist als Letzter dran. Welche Karte legst du zu? | 最后出牌，搭档用黑桃J赢定这墩：垫哪张？ | ♠10 | SkatZero：答案 33.1，第二选择 -16.8，差 49.8 |
| 14 | `schmieren-2` | **Der König hält** — Du bist als Letzter dran. Welche Karte legst du zu? | 最后出牌，搭档的黑桃K赢定：垫哪张？ | ♦A | SkatZero：答案 33.6，第二选择 -18.1，差 51.7 |
| 15 | `schmieren-3` | **Grand: Partners Ass gewinnt** — Du bist als Letzter dran. Welche Karte legst du zu? | Grand，最后出牌，搭档方块A赢定：垫哪张？ | ♣10 | SkatZero：答案 45.5，第二选择 30.3，差 15.3 |
| 16 | `mitzaehlen-1` | **Wie viele Trümpfe sind noch draußen?** — Nach vier Stichen: Wie viele Trümpfe haben die Gegner noch? | 4墩之后，对手还有几张将牌？ | 0 | 引擎：Trümpfe: 11 − gespielt − eigene |
| 17 | `mitzaehlen-2` | **Wie viele Augen hast du schon?** — Du hast alle vier Stiche gemacht. Wie viele Augen hast du jetzt – mit dem Skat? | 4墩全赢，加上底牌你现在有多少分？ | 49 | 引擎：Augen der eigenen Stiche + Skat |
| 18 | `mitzaehlen-3` | **Ist der Weg für die Asse frei?** — Nach zwei Stichen: Wie viele Trümpfe haben die Gegner noch? | 2墩之后，对手还有几张将牌？ | 1 | 引擎：Trümpfe: 11 − gespielt − eigene |
| 19 | `verlierbar-1` | **Nur noch ein Bube draußen** — Du brauchst noch 18 Augen. Kannst du das Spiel noch verlieren? | Grand 残局，还差18分：还会输吗？ | Nein – das Spiel ist sicher gewonnen（不会输（稳赢）） | 求解器：sicher: ein Weg zu 61 gegen jede Verteilung |
| 20 | `verlierbar-2` | **Sieben Augen fehlen noch** — Du brauchst nur noch 7 Augen. Kannst du das Spiel noch verlieren? | Grand 残局，只差7分：还会输吗？ | Ja – es kann noch schiefgehen（会输（还可能翻车）） | 求解器：verlierbar: eine Verteilung, in der auch offen keine 61 gehen |
| 21 | `verlierbar-3` | **Zwei hohe Buben, zwei Trümpfe draußen** — Du brauchst noch 23 Augen. Kannst du das Spiel noch verlieren? | 红心残局，还差23分：还会输吗？ | Nein – das Spiel ist sicher gewonnen（不会输（稳赢）） | 求解器：sicher: ein Weg zu 61 gegen jede Verteilung |
| 22 | `endspiel-1` | **Grand: 37 Augen fehlen** — Alle Karten liegen offen. Du brauchst noch 37 Augen. Welche Karte spielst du aus? | 明牌残局（Grand），还差37分：先出哪张？ | ♣B | 求解器：die einzige Karte, mit der offen 61 gehen |
| 23 | `endspiel-2` | **Herz: der letzte Trumpf der Gegner** — Alle Karten liegen offen. Du brauchst noch 38 Augen. Welche Karte spielst du aus? | 明牌残局（红心），还差38分：先出哪张？ | ♥10 | 求解器：die einzige Karte, mit der offen 61 gehen |
| 24 | `endspiel-3` | **Herz: Bube vor Ass** — Alle Karten liegen offen. Du brauchst noch 25 Augen. Welche Karte spielst du aus? | 明牌残局（红心），还差25分：先出哪张？ | ♥B | 求解器：die einzige Karte, mit der offen 61 gehen |
| 25 | `null-ouvert-1` | **Der blanke König** — Der Alleinspieler spielt Null ouvert, alle Karten liegen offen. Du spielst aus. Mit welcher Karte knackst du den Null? | 破明手 Null：你先出，出哪张？ | ♦8 | 求解器：der einzige Anspiel, der den Null offen schlägt |
| 26 | `null-ouvert-2` | **Hol den Partner ans Spiel** — Der Alleinspieler spielt Null ouvert, alle Karten liegen offen. Du spielst aus. Mit welcher Karte knackst du den Null? | 破明手 Null：你先出，出哪张？（要先让搭档上手） | ♣9 | 求解器：der einzige Anspiel, der den Null offen schlägt |
| 27 | `null-ouvert-3` | **Die Dame allein** — Der Alleinspieler spielt Null ouvert, alle Karten liegen offen. Du spielst aus. Mit welcher Karte knackst du den Null? | 破明手 Null：你先出，出哪张？ | ♣7 | 求解器：der einzige Anspiel, der den Null offen schlägt |
| 28 | `null-risiko-1` | **7, 9, Bube** — Null, noch fünf Stiche, du hast bisher keinen Stich. Die Gegner spielen aus. Wie sicher ist dein Null? | Null 还剩5墩，对手先出：这手牌多安全？ | Sicher – egal, wie die Karten sitzen（安全） | 求解器：alle 252 Verteilungen |
| 29 | `null-risiko-2` | **Die Herz-Acht** — Null, noch fünf Stiche, du hast bisher keinen Stich. Die Gegner spielen aus. Wie sicher ist dein Null? | Null 还剩5墩，对手先出：这手牌多安全？ | Riskant – es kommt darauf an, wie sie sitzen（有风险（看牌怎么分）） | 求解器：alle 252 Verteilungen |
| 30 | `null-risiko-3` | **König blank, Dame und Ass** — Null, noch fünf Stiche, du hast bisher keinen Stich. Die Gegner spielen aus. Wie sicher ist dein Null? | Null 还剩5墩，对手先出：这手牌多安全？ | Verloren – egal, wie die Karten sitzen（必输） | 求解器：alle 252 Verteilungen |
| 31 | `wahrscheinlichkeit-1` | **Liegt ein Bube im Skat?** — Vor dem Skataufnehmen: Dir fehlen genau zwei Buben, ♣B und ♠B. Wie wahrscheinlich liegt mindestens einer davon im Skat? | 看底牌前缺梅花J和黑桃J：至少一张在底牌里的概率？ | 18 % | 引擎：1 − C(20,2)/C(22,2) |
| 32 | `wahrscheinlichkeit-2` | **Vier Trümpfe: 2 : 2?** — Du hast gedrückt. Die Gegner haben zusammen noch vier Trümpfe, jeder zehn Karten. Wie wahrscheinlich sitzen sie genau 2 : 2? | 对手共有4张将牌：正好2:2的概率？ | 42 % | 引擎：C(4,2)·C(16,8)/C(20,10) |
| 33 | `wahrscheinlichkeit-3` | **Drei Trümpfe bei einem?** — Du hast gedrückt. Die Gegner haben zusammen noch drei Trümpfe, jeder zehn Karten. Wie wahrscheinlich hat einer von ihnen alle drei? | 对手共有3张将牌：一人全拿的概率？ | 21 % | 引擎：2·C(17,7)/C(20,10) |
| 34 | `ausspielen-1` | **Grand: Bube oder Ass?** — Du spielst Grand und kommst raus. Welche Karte spielst du zuerst? | 打 Grand，你先出：J 还是 A？ | ♣B | SkatZero：答案 85.2，第二选择 53.9，差 31.3 |
| 35 | `ausspielen-2` | **Welcher Bube zuerst?** — Du spielst Grand und kommst raus. Welche Karte spielst du zuerst? | 打 Grand，你先出：哪张 J？ | ♣B | SkatZero：答案 45.3，第二选择 19.8，差 25.6 |
| 36 | `ausspielen-3` | **Kreuzspiel ohne den Kreuz-Buben** — Du spielst Kreuz und kommst raus. Welche Karte spielst du zuerst? | 打梅花（缺梅花J），你先出：出什么？ | ♠B / ♦B / ♥B | SkatZero：答案 26.7，第二选择 11.4，差 15.3 |

## Deviations

- **题目页收录（grill Q4）：** 人决定题库主页德英都收录、单题页不收录。主页因此用原生 `<details>`，折叠的题目也写在服务器 HTML 里。SEO 检查要求页面至少有 2 个可见的内部链接，所以卡片下方除了文章链接，还加了一个「Die Skat-Regeln」小链接。
- **题型 7「还会输吗」用残局，不用开局 10 张牌**（grill Q7 已同意）。两种答案都有严格证明：「稳」给出一条对任何分牌都成立的打法；「会输」给出一种分牌，在这种分牌下即使明牌庄家也到不了 61 分。
- **题型 10「Null 有多危险」不用抽样百分比**（grill Q7 写的是抽样统计）。整手 10 张牌的明牌 Null 求解太慢，改为剩 5 墩的局面，252 种分牌全部穷举，分三档，每档都精确可证：安全（不看牌也能保住）、有风险（有的分牌会被抓、有的不会）、必输（每种分牌都会被抓）。
- **防守出牌题（题型 4）三道都是防守 Grand 的「先出 A」**（技巧第 8 条）：
  - 1000 局对局池里，花色游戏首攻满足「SkatZero 比第二选择高 10 分以上，且符合技巧」的局面一个也没有；
  - 第 2 题专门考「先出有伴的 A，不出单张 A」；
  - 防守题只展示当前这墩，不展示之前几墩。SkatZero 用全部历史核对，答案和技巧一致。
- **题库页卡片底部的两个链接**包在一个 `<nav>` 里。

## Environment

- **端口：** web 55103（构建版 server）；本地数据库 57103（容器 `skatgo-multiplayer-db-57103`，只用于 `npm --prefix multiplayer run check`）。
- **env 键：** 没有新增、修改或删除。
  - 为了建本工单的本地数据库，worktree 的 `multiplayer/.env` 被本地数据库脚本重写过（DATABASE_URL 换成 57103，admission key 沿用原值）；
  - 原文件在 `tmp/multiplayer.env.orig`；
  - 这不是需要同步回主目录的键变更。

## Residual

- 结算页链接要在真实打完一局后看一眼（留给人测）。
- 以后的自动出题：`solve.ts` 和 `tricks-judge.ts` 可以直接拿来批量筛局面。
- 花色游戏的防守首攻题（技巧第 7、9、10 条），需要更多 SkatZero 对局来筛；本次后台多跑的随机对局没有在时限内完成。
- 题库没有记录做题进度，这是需求本身（不登录、不保存）。
