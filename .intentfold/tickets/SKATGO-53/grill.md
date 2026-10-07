# SKATGO-53 grill

Grill：human（写这批问题时）。随后人授权本工单由机器自行裁决 grill（2026-10-07，原话：「grill一下53的grill」），工单 Grill 行改为 self。第 5 题属于 ui.md 红线 1，由人明确批准；其余由 pm 会话依据 charter、工单、SKATGO-49/51/52 的数据和实际观察裁决。

1. **地址**：两页都放在规则下面，和叫牌表并列。

   | 页面 | 德文 | 英文 |
   |---|---|---|
   | 记分表 | `/de/regeln/skatliste` | `/en/rules/score-sheet` |
   | 规则摘要 | `/de/regeln/zum-ausdrucken` | `/en/rules/printable` |

   - 建议：采纳。
   - 理由：地址里带目标词「skatliste」「zum ausdrucken」。
2. **记分表格式**：
   - 一页 A4 竖版：序号 | Spiel（定约）| Wert（局值）| 三名玩家各一列，表头留空写名字，列里写累计分；
   - 约 30 行，以实测一页能放下为准，大约 10 轮、每人发牌 10 次；
   - 底部是 Seeger-Fabian 结算栏，每人一列：最终分、赢的局数 × 50、输的局数 × 50（扣）、别人输的局数 × 40、合计。50 和 40 从引擎来，引擎里现在是 `seegerFabian()` 里的裸数字，要导出成常量，行为不变。
   - 只做三人，不做四人桌。
   - 建议：采纳。
   - 理由：三人是 SkatGo 自己的玩法，SF 也是三人版（防家各 +40）。四人桌的 SF 是 +30，混在一张表上容易记错。
3. **规则摘要内容**，两页 A4 以内，依次是：
   - 牌和点数（表）；
   - 将牌顺序；
   - 跟牌；
   - 叫牌：谁叫谁、完整叫价顺序（引擎）；
   - 定约和基础值（表）；
   - Null 的四个值（表）；
   - 局值 = 基础值 × 倍数；
   - 61 点赢；
   - Schneider / Schwarz；
   - 记分：赢 +局值，输 −2 × 局值；
   - 超叫。

   文字新写一份精简版，所有数字从引擎渲染，不抄。屏幕上加一行链接到完整规则页，打印时隐藏。
   - 建议：采纳。
4. **PDF 怎么来**：
   - 新脚本 `app/scripts/make-printables.mjs`，用 Playwright（已是开发依赖，不新增）把构建好的页面按 A4 打印成 4 个 PDF，提交到 `app/public/downloads/`；
   - 文件名：德文 `skatliste.pdf`、`skatregeln.pdf`，英文 `skat-score-sheet.pdf`、`skat-rules.pdf`；
   - 规则或文案以后改了，要重跑这个脚本。我会在 handoff 里写明，并作为 charter 偏差报告给你：建议在 engineering.md 的 Tools 里记一笔。
   - 建议：采纳。
   - 理由：生产环境没有浏览器，不能在线生成 PDF，也不能加依赖。
5. **需要你批准（ui.md Redline 1）：新增设计值**。
   - `dims.scoreRow`：记分表一行的高度，够手写（约 7 mm ≈ 26px）。
   - 如果实测两页放不下规则摘要，可能还要一个打印用的小字号角色。我会先只用现有字号试；放不下再单独问你，不自己加。
   - 建议：批准 `dims.scoreRow`。
6. **入口**：
   - 规则页：顶部按钮旁和「Reizen」小节附近，各加「Zum Ausdrucken: Skatliste · Kurzfassung」；
   - 叫牌表页：页尾「Weiter」那组加两条；
   - 课程页：课程列表下面加一行。
   - 建议：采纳。
7. **标题对准的词**（不和已有页面抢词）：
   - 记分表：「Skatliste zum Ausdrucken: Skat Punkte aufschreiben (PDF)」；
   - 规则摘要：「Skatregeln zum Ausdrucken: die Kurzfassung als PDF」；
   - 英文：「Skat Score Sheet (Printable PDF)」「Printable Skat Rules: the Short Version (PDF)」。
   - 建议：采纳。
8. **预览图**：4 个新页面用 `og.mjs` 生成。
   - 建议：采纳。

## 回答

1. **采纳**：`/de/regeln/skatliste`、`/de/regeln/zum-ausdrucken`、`/en/rules/score-sheet`、`/en/rules/printable`。
2. **采纳，行数改为 36**：一张表 36 行，对应德国俱乐部惯例（DSkV）三人桌一轮（Serie）36 局，俱乐部可以直接拿去用，这也是 SKATGO-54 换外链的筹码。行高随之约 6 mm（见第 5 题）。其余采纳：Spiel / Wert / 三名玩家累计列，底部 Seeger-Fabian 结算栏，50 / 40 从引擎导出的常量来（行为不变），只做三人桌。
3. **采纳，补一条**：在「叫牌」之后加「拿底牌或 Hand、扣两张（Skat aufnehmen und drücken）」，这是核心规则，原列表漏了；「局值 = 基础值 × 倍数」那条写明倍数由 mit/ohne、Spiel、Hand、Schneider、Schwarz、各自叫出（angesagt）和 Ouvert 组成，数字从引擎来。其余按建议，两页 A4 以内。
4. **采纳**：本地用 Playwright 按打印样式生成 4 个 PDF 提交到 `app/public/downloads/`，不加依赖；在 engineering.md Tools 里记这个脚本属于 charter 改动，只报告、不改，由人决定。
5. **人批准**（2026-10-07，在 pm 会话中明确批准，ui.md 红线 1）：新增 `dims.scoreRow`，**36 行、约 6 mm 一行**，保证 36 行加 Seeger-Fabian 结算栏放进一页 A4。打印用小字号角色若需要，再单独问人。
6. **采纳**：规则页、叫牌表页、课程页加入口。
7. **采纳**：已核实 SKATGO-52 交接对照表把「Skat Punkte aufschreiben」明确留给本单，第 9 课标题是「Skat Abrechnung」，不冲突。
8. **采纳**：4 个新页面生成预览图。

## 结论

全部裁决完毕（第 5 题人批准）。改进 `plan.md` / `ac.md`：记分表 36 行、行高约 6 mm；规则摘要补「拿底牌 / Hand / 扣牌」和倍数构成。其余按原稿开发。
