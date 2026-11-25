# SKATGO-235 rework

One ask after the handoff, its own commit.

## The League's coins (the human: 「关于金币……100个，每tier都是4个……还是90个……我觉得高级场不够了也不行。但是其实用户还可以攒金币。你思考」)

- Production showed two players beside the human's own accounts playing the League: Grüner Wolf 20.6 deals a day on
  average (16–25, out of coins most days), Rappelkopf76 26.6 (10–46, the big days from the week's saving). The human:
  「尽量满足它们，稍微欠一点，留个念想」.
- `CHECKIN_COINS` 90 (100 before) and `FEES` 4 in every tier (3, 4, 5, 6, 10, 12 before): 22.5 deals a day in any tier,
  about 95% of the two's average; the week's adding-up and Monday's fresh start unchanged; balances kept as they are.
- Rechecked: `league.test.ts` (unit), the League service test, the rooms test, the mechanical defence.

## Net effect against the handoff

Everything in handoff.md stands; the League's coins and fees are as above.
