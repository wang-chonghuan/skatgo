# SKATGO-50 grill

Grill：human（写这批问题时）。随后人授权本工单由机器自行裁决 grill（2026-10-06，原话：「请grill 50的grill」），工单 Grill 行改为 self。第 3 题属于 ui.md 红线 1，由人明确批准；其余由 pm 会话依据 charter、工单和 SKATGO-49 的调研数据裁决。

1. **叫牌表页的地址**：德文 `/de/regeln/reiztabelle`，英文 `/en/rules/bidding-table`。
   - 建议：采纳。
   - 理由：放在规则下面，地址里就有目标词「reiztabelle」。
2. **叫牌表的内容和形式**，从上到下：
   - 一张倍数 × 定约的矩阵：
     - 行是倍数 2–18；
     - 列是 Karo 9、Herz 10、Pik 11、Kreuz 12、Grand 24；
     - 格子里是叫价值；
     - Grand 的倍数最高 11，再往上的格子空着。
   - Null 的四个固定值。
   - 从 18 起的完整叫价顺序。
   - 一段「叫价值怎么算」的说明：基础值 × 倍数，倍数 = 带/不带几个 + 1（Spiel）+ Hand/Schneider 等。例子里的数字由引擎算出。

   上限 18 和 11 现在写死在 `value.ts` 的叫价阶梯里，要改成导出的常量，阶梯本身不变。
   - 建议：采纳。
   - 理由：这是德国玩家熟悉的 Reiztabelle 样子，所有数字都来自引擎。
3. **打印要新增一个注册表键 `bp.print`（`@media print`）**。这属于 ui.md Redline 1，需要你批准。打印时：
   - 全站隐藏顶栏、页脚和助手按钮；
   - 叫牌表页只留标题和三张表，说明文字和链接也隐藏。
   - 建议：批准，并且隐藏顶栏等是全站生效（打印别的页面也不再印出导航）。
   - 理由：打印样式只能通过媒体查询写；只在这一页隐藏顶栏，得把页面状态传进框架，更绕。
4. **规则页的定位**：
   - 德文标题：「Skat Regeln einfach erklärt – alle Regeln mit Beispielen | SkatGo」；
   - 德文 h1：「Skat Regeln einfach erklärt」；
   - 德文描述以「Skat Regeln einfach erklärt:」开头，列出 Reizen、Grand、Null ouvert、Ramsch、Spielwert 和叫牌表；
   - 英文同步：「Skat Rules Explained Simply …」。

   面包屑和首页链接里的页名「Skatregeln / Skat rules」不变，只改 h1。
   - 建议：采纳。
   - 理由：工单要求标题、描述和 h1 都对准「Skat Regeln」。
5. **Grand、Null ouvert、Ramsch 的可链接位置**：在现有小节里各加一个带固定锚点（`#grand`、`#null-ouvert`、`#ramsch`，两种语言一样）的子标题，目录里也列出来。
   - 现在分在两处的 Null ouvert 内容并到它的子标题下。
   - Ramsch 写成一段较完整的常见玩法：只有 Bube 是将牌，各自为战，牌点最多的人输；还有 Jungfrau、Durchmarsch、Skat 归最后一墩、Schieben。并写明这是 Hausregel，SkatGo 不玩。
   - 不做子页。
   - 建议：采纳。
   - 理由：工单允许小节或子页。子页内容太薄，反而对搜索不利。
6. **课程页**：
   - 德文标题「Skat spielen lernen – kostenloser Kurs für Anfänger | SkatGo」，h1「Skat spielen lernen」，导语写进「für Anfänger」；
   - 英文标题「Learn to Play Skat – Free Course for Beginners | SkatGo」，h1 不变。

   课程的页名 `course_title` 也就随 h1 一起变：首页链接和面包屑会从「Skat lernen」变成「Skat spielen lernen」。
   - 建议：采纳。
7. **打牌页**：
   - 德文标题：「Skat kostenlos spielen – ohne Anmeldung, ohne Werbung, gegen den Computer | SkatGo」。超过 60 字，但目标词都在前面。
   - h1：「Skat kostenlos spielen – gegen den Computer」。
   - 描述写明 kostenlos、ohne Anmeldung und Registrierung、ohne Werbung、gegen zwei Computergegner、im Browser。
   - 正文导语补上「ohne Werbung」「ohne Registrierung」。
   - 英文同步。
   - 不写离线。
   - 建议：采纳。
8. **规则页里有一句已经不真实**：「SkatGo wertet nicht nach Seeger-Fabian」。每日赛自 SKATGO-35 起按 Seeger-Fabian 计分。改成：自由对局和牌桌只记局值，每日赛按 Seeger-Fabian 计分（英文同步）。
   - 建议：在本单改。
   - 理由：本单正是让搜索用户来读这一页，不能留错话。
9. **预览图**：
   - 新页面生成自己的预览图 `bidding-table-{de,en}.png`；
   - 规则页、课程页、打牌页的 h1 改了，按 SKATGO-29 的 `og.mjs` 办法重新生成这几张，其他页面的不动。
   - 建议：采纳。

## 回答

1. **采纳**：`/de/regeln/reiztabelle`、`/en/rules/bidding-table`。依据：SKATGO-49 中「skat reiztabelle」3,600/月、难度 0，地址带目标词。
2. **采纳**：矩阵 + Null 四值 + 完整阶梯 + 算法说明，数字全部来自引擎，导出倍数上限常量、阶梯数值不变。
3. **人批准**（2026-10-06，在 pm 会话中明确批准，ui.md 红线 1）：新增 `bp.print`；打印时全站隐藏顶栏、页脚和助手按钮，叫牌表页只印标题和三张表。
4. **采纳**：规则页 title/h1/描述按建议；面包屑和链接里的页名不变。
5. **采纳**：三个固定锚点子标题，不做子页。补充：Ramsch 的 Jungfrau、Durchmarsch、Schieben 等写明是常见玩法、各地不同，并写明 SkatGo 不玩 Ramsch（工单约束：只写真话）。
6. **采纳**：课程页按建议；`course_title` 随 h1 改为「Skat spielen lernen」可以接受（德文目标词「skat spielen lernen」1,900/月，难度 2）。
7. **采纳，标题缩短**：德文 title 用「Skat kostenlos spielen – ohne Anmeldung, ohne Werbung | SkatGo」，约 60 字以内，保证搜索结果里「ohne Werbung」不被截掉；「gegen den Computer」放进 h1（「Skat kostenlos spielen – gegen den Computer」）和描述。依据：SKATGO-49 中「skat kostenlos spielen」33,100、「skat spielen ohne anmeldung」5,400、「skat spielen gegen computer kostenlos」5,400，前两个放标题，第三个靠 h1 和描述。英文同理。
8. **采纳，本单改**：工单约束「只写真话」，搜索用户会来读这一页。
9. **采纳**：新页面生成预览图；h1 变了的三页按 `og.mjs` 重新生成，其余不动。

## 结论

全部裁决完毕（第 3 题人批准）。改进 `plan.md` 的只有第 7 题的德文/英文标题改短；其余按原稿开发。
