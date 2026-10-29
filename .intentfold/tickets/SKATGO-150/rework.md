# SKATGO-150 rework

Four rounds after the handoff. Each was committed once, with the human's ask as the commit's first line.

1. 「坐哪个位置的那行字，不要小字，要和how high do you bid同一字体。应该是bidding practice 1/300 进度放这里，上面那个单列进度的行不要」
   - The seat line now uses `prompt`, navy, the same as the question.
   - The place in the run sits beside the H1 as "n/300", in the heading's type, in slate.
   - The kicker pill and its message are gone.
   - Rechecked: AC2 and AC6.
2. 「Your bidding 这个怎么也是小字体呢」
   - The card's heading now uses `prompt`, navy.
   - Rechecked: AC3 and AC6.
3. 「your biding这个词不好，应该是 表现，结果，成绩，记录什么的，你查查chess.com， funbridge上用的啥词」
   - chess.com says "Stats" / "Puzzle Stats"; Funbridge says "statistics".
   - The heading is now "Your stats" / "Deine Statistik".
   - Rechecked: the full script, 9/9.
4. 「mistakes 最好可以折叠，否则我怕太多？」
   - The mistakes are a `<details>`, closed at first: one line with "Mistakes", the count and a chevron, opening to the numbered buttons.
   - Rechecked: AC2 (now also checks the list starts folded) and AC6.

Net effect against the frozen handoff:
- The page heads with "Bidding practice n/300".
- The seat line and the stats heading are in the question's type.
- The card is called "Your stats".
- The mistakes fold.

Records, AC and data are unchanged.
