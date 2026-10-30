# SKATGO-159 grill

Grill: human. Asked only what passes the bar; the user said 「直接开发」 and the direction is settled, so each
question below was decided from the request and the code, none reached the human.

1. **How many questions?** — Recommendation: as many as qualify up to about 150, basic ≤ ¼. Reason: the user said
   「不用600个，可以减少」 without a number; the pool's qualifying hard hands set the ceiling. Decided.
2. **How is "how far" asked?** — Recommendation: in step 2, the offered numbers include the ten-card value and SkatZero's
   own stop, each with its chance in the explanation; no separate "the opponent said 30" question. Reason: the AC
   accepts either; one format keeps the two-step page unchanged. Decided.
3. **Which SkatZero number is shown?** — Recommendation: the chance it makes the game at a bid, over all skats, in whole
   percent. Reason: the user approved "AI 在各价位的胜率"; it is the number a learner can weigh. Decided.
4. **Production rows** — Recommendation: delete every pre-v2 `bidding_answers` row when the new service starts. Reason:
   the user: 「用户已经答过的，可以删除记录，不要影响新版」. A backup is taken before the deploy. Decided.
