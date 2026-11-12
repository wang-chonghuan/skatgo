# SKATGO-191 rework

Against the frozen handoff (one person for a declared game, two for a defended one, no head, no words), four rounds:

1. 「看不清，一个小人时就fill那个图标吧」 — `afbf094`: the one-person sign filled. Rows rechecked (8 contexts), screenshots.
2. 「一个圆圈里 有个大写的D如何呢」 → advised against a letter (D is the Dame on the cards, and the poker button marks the
   dealer) → 「可以，那就只做庄家，防就不做了」 — `8f09af6`: only the declarer marked, a navy disc with a white person;
   defended games unmarked; `history_defender` removed. Rows rechecked.
3. 「你还是他妈的用拍卖锤子图标吧，别太大，透明就行」 — `39d977b`: lucide `Gavel`, outlined navy, 18px, no disc. Rows rechecked.
4. 「还是用刚才那个王冠吧」 — `7a093ea`: lucide `Crown`, outlined navy, 18px, no background. Rows rechecked.

Net effect against the handoff: a small outlined navy crown on declared games only; nothing on defended or passed games;
no head over the column, no role words in the table. Mechanical defence run once over the final branch before the merge.
