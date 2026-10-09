# SKATGO-63 grill

Batch 1, written before asking. Decision-maker: the human.

## Q1. What does an unplayed row show?

**Recommendation:** the deal's number, then a status word where the scores go: "läuft" / "in progress" for the deal being played, "offen" / "not played" for the rest; "–" under the AI and the difference. Unplayed rows cannot be opened. The total row appears only once a deal is finished.

**Reason:** the row must not give anything about the cards away (everyone plays the same ones), so number and status are all it can show. The same four columns keep the finished and unplayed rows aligned on a phone.

**Answer:** the recommendation (the human, 2026-10-09).

## Q2. The panel's heading

**Recommendation:** "Die Spiele von heute" / "Today's deals" (the existing `daily_play_title` text) in place of "Du gegen die AI" on the tournament page while the day runs. The finished day's "Dein Ergebnis heute" stays.

**Reason:** before anything is played, "Du gegen die AI" over six empty rows says nothing. The columns still say Du / AI.

**Answer:** the recommendation, "Die Spiele von heute" / "Today's deals" (the human, 2026-10-09).

## Q3. Render the 6 rows on the server too?

**Recommendation:** yes. The server renders the table with 6 "offen" rows; the browser then fills in the visitor's own progress. While the status loads, the browser shows the same 6 rows, so nothing jumps.

**Reason:** the table is then visible without JavaScript and to search engines, and the page's first paint already shows the 6 deals. Cost: a returning player sees "offen" for a moment before their results.

**Answer:** yes, the recommendation (the human, 2026-10-09).

## Q4. The charter

`product.md` says the comparison is "a table of both that grows by one row per deal, also on the day's page", and `ui.md` says `VsAiTable` has "one row per finished deal". This ticket makes the day's page show all 6 rows from the start.

**Recommendation:** you approve editing both sentences in this ticket (product.md Redline 1), to say the day's page lists all of the day's deals, unplayed ones marked, with no cards.

**Reason:** otherwise the charter contradicts the shipped page.

**Answer:** approved: edit both sentences in this ticket (the human, 2026-10-09; product.md Redline 1, recorded on the ticket).

## Q5. The table's in-game fold

**Recommendation:** leave it. "Tagesverlauf: n von 6 Spielen" on `/daily/play` keeps listing only finished deals.

**Reason:** the ticket asks for the tournament page; the fold's label already says "of 6".

**Answer:** the recommendation; it was part of the option the human chose for Q1, which said the in-game fold stays unchanged (2026-10-09).
