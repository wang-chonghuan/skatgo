# SKATGO-63 rework

Changes after the first delivery (`handoff.md`, commit `fd9e1c5`), one commit per request.

1. **"2026年10月9日。所有玩家使用相同的牌，对手也是相同的电脑。下一局将于9小时57分钟后开始。这句删掉，垃圾句子，重复了"** (`08d513f`)
   - The tournament page loses the date-and-countdown line under the lead. The lead already says the same cards, the same computers, and new deals at midnight in Berlin.
   - Only that line used `dailyDate`, `untilNextDeals` (`lib/daily.ts`) and the messages `daily_lead` and `daily_countdown`; they are removed.
   - Rechecked at desktop and phone, German and English: one lead paragraph, no date or countdown, the 6 rows still there, no page errors.
2. **"按钮要放到表格的上方，不要全宽，否则用户不知道是按钮"** (`9b22e20`)
   - "Heute spielen" / "Weiterspielen: Spiel n von 6" now comes before the day's table, in a row of its own so it keeps its own width, as the front page's hero button does. The same holds in the server's rendering.
   - Rechecked at desktop and phone, with JavaScript off, fresh, and mid-day after one deal: the button sits above the table with no horizontal overflow. It takes its text's width (188–326 px). On a phone mid-day the long "Weiterspielen" text makes it nearly the column's width.
3. **"Kostenlos und ohne Anmeldung. … 这里加上，还能看到AI坐在您的位置，能打多少分"** (`7a761e0`)
   - The lead adds: "Nach jedem Spiel siehst du, wie viele Punkte die AI auf deinem Platz geholt hat." / "After each deal, see how many points the AI scored in your seat." It says "AI", as the table's column does; the reading section below still says "KI".
   - Rechecked: the sentence is in the server's HTML in both languages and shows at desktop and phone with no overflow.

The AC were not affected: the table and its rows are unchanged, and the criteria do not cover the lead or where the button sits.

Net effect against the handoff: the tournament page reads title, lead (now with the AI sentence and without the date line), the button at its own width, then the table of all of the day's deals.
