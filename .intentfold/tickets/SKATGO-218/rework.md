# SKATGO-218 rework

Against the frozen handoff (d8a0f70). Each round one commit; the affected checks rerun each time (`tmp/ac-rework*.log`),
the mechanical defence once per round.

1. 「标题要换成points，然后眼睛图标放在points旁边」 (1d6bdad) — the English heading "Card points" became "Points" (German
   "Augen" unchanged); the eye moved from beside the numbers to the heading's line. Rechecked: AC1–3, AC5.
2. 「应该有对齐，不该直接跟着points」 (b3abd6f) — the heading centred as every cell's, the eye against the cell's right edge
   with an empty place of its size at the left. Rechecked: AC1–3, AC5.
3. 「你做的什么垃圾，都没对齐」 (ced29fe) — in tricks mode the heading line had lost its row layout and the cell sat 5 px
   low. Fixed; a row-alignment check (heading, number, small line against the contract cell) added and shown to catch the
   old build. Rechecked: all, plus ALIGN.
4. 「这个图标要始终显示」, then 「不要数墩模式了，要么是points，要么显示个横线 - : -」 and 「就一个横线就行，不用 -：-了」
   (0aa5575) — SKATGO-127's tricks mode removed entirely (the cell switch, `boardTricks`, `runningTricks`, its messages);
   the eye always there; hidden shows a single "—". Rechecked: all, plus NOTRICKS.
5. 「垂直方向没和points对齐，稍微靠下了一点」 (0d4f0fc) — the heading's 2 px gap moved under the whole line, so the eye centres
   on the letters: 1.19 px low before, 0.19 after; an EYELEVEL check (≤ 0.5 px) added. Rechecked: all (33 pass).

Net effect against the handoff: the points cell shows card points only, heading "Points" / "Augen" centred, the eye always
at the cell's right edge on the heading's line, hidden by default as a single dash, remembered per browser; the cell tap no
longer switches anything. Still left to the human's own play: the cell mid-deal.
