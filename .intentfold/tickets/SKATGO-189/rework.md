# SKATGO-189 rework

Against the frozen handoff (`1fb96ba`), four rounds, one commit each:

1. 「我觉得declare和defender的标签太大了」 — `35477a9`: the tags at the smallest text, tighter. Rechecked by screenshots
   (desktop and phone, front card and record).
2. 「不是，我觉得你这个东西设计的不太好，不是说它图标太大」 → three options shown → 「我比较喜欢第三个，然后Game是否改为Contract，
   我不知道skat怎么叫这个东西的，但是这里不要再显示红心等符号了」 — `b9f2b50`: the tags replaced by a "Declarer" column with a tick
   (nothing for a defender or all passed; on a phone the word follows the tick); the head "Contract" in English (the
   table's word; German keeps "Spiel"); the contract in words without its suit's sign. Criteria 1–4 rerun: all pass.
3. 「第三列的列头很sb，删掉」 — `7c4aea8`: the cards' column has no head; on a phone the head is one line. Screenshots.
4. 「详情表里，replay放在最后一列」 — `d41a971`: Replay is the record table's last column, after the difference; on a phone
   still its own line. Criterion 2 (rows and Replay links, all 8 profile contexts) rerun: pass.

Net effect against the handoff: no tags — a tick column "Declarer"; contracts in words without signs; head "Contract",
"Declarer", "vs. AI" (no cards head); Replay last on the record. Messages `history_defender` and `history_head_cards`
removed. Mechanical defence run once over the final branch before the merge.
