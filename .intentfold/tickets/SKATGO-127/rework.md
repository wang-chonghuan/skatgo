# SKATGO-127 rework

Three rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「那个课程卡片，把11课字样去掉，会把人吓跑。然后学习页面里，要有明显的按钮，5分钟快速入门开始打牌。本工单改」**
   (456e86d). The front page's course tile lost its lesson count; the course page got a large `quiet` landing
   button under its intro, "5-minute quick start, then play" / "5-Minuten-Schnellstart, dann spielen", to
   `/course/quick-start`. Rechecked: the tile title and the button on the built pages.
2. **「这个计算，不是应该是170吗，怎么你公式算的是120」** (08fac20). The result line's calculation ended at the game
   value while the tournament's, free play's and private tables' totals count Seeger-Fabian. It now ends in the
   score the table counts: "won: 120 + 50 = +170 (Seeger-Fabian)", "lost: −2 × v − 50 = … (Seeger-Fabian), each
   defender +40"; the course's own game keeps the game value. A private table's settlement line shows the same
   Seeger-Fabian score. Rechecked: `formula.test.ts`, now six cases including both Seeger-Fabian ones.
3. **「课程页面这些东西去掉，然后入口卡片叫交互式学习skat」** (125c968). The course page dropped its three facts
   pills (lessons and minutes, ages 6–99, progress saved on this device) and the lead's second sentence (no
   rulebook to memorize); the tile is now "Learn Skat interactively" / "Skat interaktiv lernen". Rechecked: the
   served `/en/course` and the tile titles on `/en` and `/de`.

Net effect: on top of the handoff's tricks switch and calculation line, the calculation's last step matches the
score sheet, the course tile reads "Learn Skat interactively" without a count, and the course page is its title,
one-sentence lead, the quick-start button, the progress card and the lessons. The charter (`ui.md`) follows each
round. No env change.
