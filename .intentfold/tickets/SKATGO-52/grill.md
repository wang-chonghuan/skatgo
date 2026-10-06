# SKATGO-52 grill

Grill：human，由人回答，下列建议是机器的推荐。

1. **目标词 → 页面 对照表**（德文）。主词必须同时出现在标题、描述和 h1 里，副词放进标题或导语。搜索量来自 SKATGO-49/51。

   | 课 | 主词 | 副词 | 拟定标题（question 部分） |
   |---|---|---|---|
   | 1 | wie spielt man Skat（480） | Skat erklärt（170）、Skat spielen wie geht das | Wie spielt man Skat? Skat kurz erklärt |
   | 2 | Skat Kartenwerte（50） | Skat Punkte zählen（110）、Augen | Skat Kartenwerte: Welche Karte zählt wie viele Augen? |
   | 3 | Trumpf-Reihenfolge（50） | Buben-Reihenfolge、Farben-Reihenfolge | Skat Trumpf-Reihenfolge: die Buben und die Farben |
   | 4 | Bedienen beim Skat | Wer bekommt den Stich | Bedienen beim Skat: Wann muss man bedienen? |
   | 5 | Grand und Null | Nullspiel | Grand und Null beim Skat: die zwei anderen Spielarten |
   | 6 | Spielwert berechnen | Spitzen, mit/ohne | Skat Spielwert berechnen: Grundwert, Spitzen, Stufe |
   | 7 | Reizen beim Skat（1,900） | Skat reizen erklärt（110）、Reihenfolge（110） | Skat reizen erklärt: Wie Reizen beim Skat funktioniert |
   | 8 | Skat drücken | Handspiel | Skat drücken oder Hand spielen: Was tun mit dem Skat? |
   | 9 | Skat Abrechnung（40） | Schneider, Schwarz, überreizt | Skat Abrechnung: Schneider, Schwarz, überreizt |
   | 10 | Skat Tipps（50/70） | Todsünden（260）、Tricks und Kniffe（110） | Skat Tipps: Tricks und die Todsünden für Anfänger |
   | 11 | Skat üben | ganze Partie | Skat üben: eine ganze Partie zum Abschluss |

   - 建议：采纳。
   - 理由：每个主词只由一个页面承接，并避开已被占用的词：
     - 规则页：Skat Regeln；
     - 课程页：Skat spielen lernen、für Anfänger；
     - 叫牌表：Reiztabelle、Reizwerte；
     - 打牌页：kostenlos、gegen den Computer。
   - 第 7 课去掉标题里的「Reizwerte」，交给叫牌表。
   - 第 10 课的「für Anfänger」出现在「Todsünden für Anfänger」里。它不是「Skat für Anfänger」这个词，但如果你不想有任何重叠，就改成「Skat Tipps: Tricks und die häufigsten Todsünden」。我推荐后者。
2. **英文入口页**：用英文第 1 课（`/en/course/how-does-skat-work`），标题「How to Play Skat: the Skat Card Game Explained」，h1「How to play Skat, the card game for three」。
   - 建议：采纳。
   - 理由：英文规则页已经对准「Skat rules」，英文课程页对准「Learn to play Skat」。第 1 课本来就讲「Skat 是什么、怎么玩」，内容最贴「skat card game」和「how to play skat」。
3. **网址（slug）不改**，只改标题、描述、h1 和导语。
   - 建议：采纳。
   - 理由：改 slug 等于换网址，Google 已收录的旧网址会变成 404。地址里没有目标词，对排名影响很小。
4. **第 10 课承接技巧词**：导语写成「Skat Tipps」，列出这节课教的典型错误（Todsünden），都是课程里真的教过的：
   - 庄家在吊完将牌前就打 A；
   - 防家自己出将牌；
   - 同伴赢墩时不送分（schmieren）；
   - 坐在最后一家时用大将牌赢墩；
   - 不数将牌。

   不写课程里没有的技巧。
   - 建议：采纳。
5. **第 9 课和可打印记分表工单（SKATGO-53）的分工**：第 9 课承接「Skat Abrechnung」；「Skat Punkte aufschreiben」（210）留给 SKATGO-53 的记分表页，本单不用这个词。
   - 建议：采纳。
6. **第 5 课和规则页的分工**：
   - 第 5 课承接「Grand und Null」「Nullspiel」；
   - 规则页继续用锚点 #grand / #null-ouvert 承接「Null ouvert」，规则页标题不含这几个词；
   - Ramsch 只在规则页。
   - 建议：采纳。
7. **预览图**：h1 改了的课程（德文 11 张，英文第 1 课）用 SKATGO-50 的 `og.mjs` 重新生成。
   - 建议：采纳。
8. **OpenSEO 标签**：这个会话没有 OpenSEO 的工具。对照表写进 handoff，在 OpenSEO 里打标签留给 pm 会话或你来做。
   - 建议：采纳。
9. **charter 更新**（你在开工时要求）：
   - **product.md** 每日赛那句改为：每副打完后有一张可折叠的对比表，每行是你和 AI 的 Seeger-Fabian 分数、角色和分差，点开是两边整副结果（定约、胜负和牌点、Schneider/Schwarz/超叫、局值、本方牌点）；最新一副默认展开（SKATGO-48）。
   - **engineering.md**：在 SKATGO-42 那条关键决定和路径表里补上：每副结束时摘要里写入 `detail`（局值、双方牌点、超叫、Schneider、Schwarz），读取时不重放、不兼容旧记录（SKATGO-48）。
   - **ui.md**：组件表加一行 `VsAiTable`（`daily-comparison.tsx`）：可折叠的逐副对比行，加上合计行。
   - 建议：采纳。

## 回答

（待人回答）
