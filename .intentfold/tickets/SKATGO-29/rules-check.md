# SKATGO-29 规则文案：待人工核对的点

涉及文件：`app/src/lib/skat/rules/content.{en,de}.ts`（规则页）、`app/src/lib/skat/lessons/guide.{en,de}.ts`（课程落地页）。
下面每条写明：我写了什么 → 需要核对什么。标 **[引擎≠ISkO]** 的是我认为引擎与官方规则可能不一致的地方。

## A. 引擎与 ISkO 可能不一致（建议优先看）

1. **[引擎≠ISkO] Null 低于叫牌值时不判超叫。** `value.ts settle()` 的 Null 分支完全不看 `bid`：叫到 30 后宣 Null（23）赢了照样 +23。ISkO 下 Null 的固定值低于叫牌值应属超叫（输）。界面 `DeclarePicker` 只是把不够的选项标“short”，并不禁止。规则页**没有写** Null 超叫的规则（回避了）。→ 请确认 ISkO 对 Null 超叫的处理，并决定是否修引擎（另开单）。
2. **[引擎≠ISkO] 叫牌只能一步一步往上。** 引擎 `bidAction('bid')` 永远叫 `nextBid(当前值)`，不能跳叫。规则页写了：“真实牌桌可以跳过数字；SkatGo 每次叫下一个数”。→ 确认此描述可以接受（ISkO 允许跳叫，我比较确定）。
3. **[引擎≠ISkO] 发牌方式。** 引擎把洗好的牌按 10/10/10/2 整块分给前手、中手、后手、Skat；ISkO 是 3–Skat 2–4–3。规则页写了官方方式，并说明 SkatGo 由电脑洗牌按每人十张分发、“结果相同”。→ 确认“结果相同”（随机性等价）这个说法可以接受。
4. **全员 pass 后由下一位发牌。** 引擎/界面 `newGame()` 总是 `next(dealer)`，所以 pass 掉的一局也换发牌人。规则页写“the next dealer deals again / der nächste Geber gibt neu”。→ 核对 ISkO：eingepasst 后是否由下一位发牌（我记得是，但不是 100% 确定）。
5. **Schwarz 的判定只看墩数。** 引擎：`defenderTricks === 0 || declarerTricks === 0`。庄家一墩没拿但 Skat 里有分，仍算庄家被 Schwarz。规则页写“一方一墩都没拿就是 Schwarz”。→ 与 ISkO 一致性请确认（我认为一致）。
6. **输掉的“叫了 Schwarz/Ouvert”局的计分。** 引擎：叫了 Schwarz 却没全拿，输，但倍数里仍含 Schneider、Schneider angesagt、Schwarz、Schwarz angesagt（即按承诺的级别算，再 ×2 扣）。规则页只写“没做到就输”，没展开计分细节。→ 确认 ISkO 同样按承诺级别计失分。

## B. 规则页上我不完全确定的事实陈述

7. **ISkO 的发布方。** 写成“DSkV 和 ISPA 的官方规则”。→ 确认两者都是 ISkO 的发布/认可方。
8. **四人桌。** 写“四人时发牌人本局不打，发牌人右手是后手”。→ 确认（我认为正确，但引擎只有三人桌）。
9. **德国牌（德式花色）。** 写“Eichel, Grün, Rot, Schellen；Ober/Unter 代替 Dame/Bube”（英文：acorns, leaves, hearts, bells）。→ 确认叫法。
10. **切牌。** 写“发牌人洗牌，右手玩家切牌”。→ 确认 ISkO 是右手切牌。
11. **前手在没人报数时可以 18 拿下。** 引擎 `forehandAlone` 如此；规则页照写。→ 与 ISkO 一致（较确定）。
12. **后手叫牌时从上一个数继续。** 引擎第二轮从 `b.value`（第一轮最后的数）接着往上叫。规则页写“carrying on from the last number said / macht beim zuletzt genannten Wert weiter”。→ 确认。
13. **Ouvert（花色/Grand）只能 Hand，且包含 Schwarz angesagt。** 引擎 `normalise()` 如此；规则页照写。Null ouvert 可以拿 Skat 也可以 Hand。→ 与 ISkO 核对（较确定）。
14. **Schwarz angesagt 包含 Schneider angesagt。** 引擎如此；规则页照写。→ 确认。
15. **“拿起 Skat 后不能再做任何宣告。”** 花色/Grand 的 Schneider/Schwarz/Ouvert 宣告都要求 Hand；但 Null ouvert 拿了 Skat 后也能打，我把它当作“游戏种类”而不是“宣告”。→ 确认措辞不会误导。
16. **扣牌可以扣任何两张（包括 J）。** 规则页说“any two cards / zwei beliebige”，引擎允许任意两张。→ ISkO 允许扣 J（较确定）。
17. **超叫计分。** 写“按能覆盖叫牌值的最小底值倍数计，再 ×2 扣”。例子：Pik Hand 叫 44，Skat 里有 ♣J → with 1，33 < 44，按 44 计，−88。与引擎/课程第 8 课一致。→ 请复核算术。
18. **例子算术（全部按引擎底值）。** Kreuz mit 2 = 12×3 = 36；Grand Hand ohne 3 = 24×5 = 120；计分表：Herz mit 1 = 20，Grand mit 1 输 = −96，einfacher Null = 23，Anna 合计 43。→ 复核。
19. **Seeger-Fabian。** 写“赢一局 +50，输一局 −50，庄家输时防守方得奖励分”，**没写具体奖励数**（三人桌每人 +40、四人桌 +30，我不确定当前规则）。→ 请核对当前 DSkV 的 Seeger-Fabian：庄家输是 −50 吗？防守方奖励是多少？
20. **“俱乐部和联赛通常用 Seeger-Fabian”。** 原想写“比赛/Turnier”，但 Turnier/tournament 是禁用词，改成“Clubs and leagues / Im Verein und im Ligaspiel”。→ 确认说法准确。
21. **Kontra/Re。** 写“Kontra 翻倍，Re 再翻倍；什么时候能说各桌不同”。我没说它是否属于官方规则（据我所知 DSkV 部分比赛规则里有 Kontra/Re 的规定，不确定）。→ 确认把它归为“House rules”是否妥当。
22. **Ramsch。** 写“全 pass 时打 Ramsch：通常只有 J 是将，各自为战，拿分最多者输；计分差异很大”。→ 确认通常玩法。
23. **Bock。** 触发条件举例：“60:60 结束的一局、带 Kontra 的输局、很高的一局”，Bockrunde 内每局翻倍。→ 这些是常见触发，但各地不同，请确认例子合理。
24. **SkatGo 的计分板。** 写“SkatGo 牌桌为三个座位各记一个累计分；自由对局里你自己的结果逐局累加”。依据：`game-table.tsx` 的 `scores[3]`（只加到庄家那一栏）和 `progress.ts` 的 tally（只记玩家本人做庄的得分，做防守记 0）。→ 确认措辞与实际界面一致。
25. **“Grand 的底值最高”。** 用文字而非数字写，符合要求。

## C. 课程落地页（guide）里的点

26. **第 1 课 / 第 7 课：“发牌人是后手”。** 与课程第 7 课一致（三人桌）。四人桌不适用，落地页没提四人桌。
27. **第 7 课落地页写了叫牌阶梯开头：18, 20, 22, 23, 24, 27, 30。** 与引擎 `BID_LADDER` 一致；课程本身也写了这些数字。→ 如果希望落地页也完全不手写阶梯数字，需要改掉。
28. **第 6 课落地页写了底值 ♦9 ♥10 ♠11 ♣12 Grand 24。** 与引擎一致，课程第 6 课也原样写了。要求里只禁止规则页手写底值，落地页我保留了。→ 如 AC3 的检查也扫描课程页文本，需确认不会冲突（数字本身是对的）。
29. **第 9 课落地页：Ouvert 描述为“face up / offen”，并说“每项宣告加一级，没做到就输”。** 没展开 Ouvert = Schwarz angesagt。→ 可接受吗？
30. **第 11 课落地页提到“Hint/Tipp”按钮。** 这是第 11 课牌桌自带的功能，不算其他功能。→ 确认不违反“只写本课”的要求。
31. ~~第 1 课落地页的“德国最受欢迎的纸牌游戏”~~：已改成与课程一致的“Germany's national card game / das deutsche Nationalkartenspiel”。
32. **slug 唯一性。** `lessonBySlug()` 跨语言查找，所以英德 slug 也不能重复；已检查无重复。
