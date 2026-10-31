# SKATGO-166 rework

Against the frozen handoff (b8e0b2c). Four rounds, one commit each.

1. 「不要让牌遮住叫分，叫牌的字层级最高」 (972ee52) — Lina's and Noah's bid chips are drawn after the skat and the trick's
   cards, so nothing in the frame covers them (amends SKATGO-158's "under the skat"; ui.md). Rechecked in free play's
   bidding at 1280×820 and 375×812: the chip over the skat is the topmost element at its spot (`tmp/said.mjs`).
2. 「The AI in your seat 这里应该改成，如果AI打你的牌」 (7e6373b) — the heading reads "If the AI had played your cards" /
   "Hätte die AI deine Karten gespielt". Typecheck and build; the string is in the built bundle.
3. 「你那个+86是什么意思？然后70 50什么意思，然后为啥不写ai打的时候，最后每个人得几分呢」 (c7c931b) — the AI's part tells its
   deal as the result tells the player's: no bare number in the heading; bidding rows only where the AI bid otherwise
   (what each said, the game left to the next line); "AI won Clubs ♣ · 70 : 50 card points"; the score table with the AI
   in the player's column. `ScoreTable` moved to `daily-comparison.tsx`. Room check rerun: 38 PASS.
4. 「分四段：本deal结果 / 如果AI打你的牌 / 偏差最大的一墩牌 / 逐墩分析。四个标题，四块……skat的地方用符号」 (7e8c4c7) — the
   dialog is four parts under their headings, a fine rule between ("Result of this deal", "If the AI had played your
   cards", "Biggest difference from the AI", "Every trick vs. the AI", the last its heading the line to tap); a private
   table has the first alone; the skat in symbols ("Skat ♣D ♠D"). Room check rerun: 71 PASS, a passed-in deal included.

Net effect against the handoff: the bid chips lie over the skat; the AI's side is its own deal with each seat's score
and labelled card points; the dialog is four headed parts; the skat is text. The AI's three parts are still seen only
after a played deal against the AI — left to the human's own deal.
