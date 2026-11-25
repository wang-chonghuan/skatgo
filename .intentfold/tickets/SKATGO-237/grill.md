# SKATGO-237 grill

## Questions for the human
None passed the bar — every material choice was settled in the conversation that filed the ticket.

## Decided for you
1. Start line 1500 or 1000? — 1500. Basis: the human chose 开单 on "1500 起步、2000 升段、0 降段" after the retention comparison.
2. Rescale existing points? — No. Basis: start and relegation lines are unchanged, only the promotion line moves closer;
   the human was told a player above 2000 moves up after their next deal and filed the ticket on that.
3. Promote players already ≥2000 at deploy time without a deal? — No; after their next counted deal, through the
   existing `standingAfter` rule. Basis: same as 2; no special branch (one rule for everyone).
4. Per-tier lines? — Same in every tier. Basis: SKATGO-219 「每个tier的升级分数都要一样，别乱搞」.
