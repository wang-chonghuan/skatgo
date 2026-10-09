# SKATGO-68 rework

Changes after the first delivery (`handoff.md`, commit `253b64e`), one commit per request.

1. **"这个设计基本上完美。但是最好在任何情况，都能让左上角的数字漏出来，否则我要从右下角倒着看才行。可能你没必要让两张牌的顶部在一条线上？思考一下。你先push再改，因为当前版本不错了其实"** (`d0cd18b`)
   - The first delivery was already pushed.
   - The trick now steps up from left to right: Lina's lowest, yours one step up, Max's highest. Where two cards overlap side by side, the right one's top-left corner lies inside the left one, so it must lie higher.
   - Two new stage values, approved by the human (ui.md Redline 1): `stage.trickSecond` and `stage.trickThird`.
   - The check found that on the smallest stage (a phone held sideways) the numbers and an 18 px clearance from your plate cannot both fit. The numbers come first; your plate lies on top.
2. **"台阶还可以，但是遮挡的有点多，数字下面的符号也被遮挡了"** (`0d0e2be`)
   - Each step is now as tall as the whole corner index, the number and the suit: 50u, 37u in portrait.
   - A first attempt also spread the cards past the frame. The human rejected it (「错了，纵向上可以了，横向上，你不用上中间那张牌漏出来那么多」), so the cards keep their sideways places.
3. **"三张牌最上面的牌的上边距，和最下面牌的下边距，应该一样，目前太靠上了"** (`4ff23db`)
   - The three cards are centred in the frame's height, their tops measured from the frame's middle (`stage.trickFirst`, `trickSecond`, `trickThird`; `dims.trickEdge` removed). Measuring from the frame's middle keeps its 2 px border from tipping the balance (the first attempt was 4 px off; the check caught it).
4. **"这个地方溢出了，你本工单修改"** (`0da1fb5`)
   - The side panel's overflow, brought in unchanged from SKATGO-58's delivered fix (`dcef5f8`).
     - A `Pill` is never wider than where it sits, and breaks only after a " · ".
     - The trick count and the card points are two pills.
   - SKATGO-58 is closed with this ticket; its record is kept in `tickets/SKATGO-58/`.

**Rechecked** after rounds 1–3 with `tmp/ac68.mjs`, at desktop, phone portrait and phone landscape, two full tricks each:
- the cards are as big as the hand;
- every card's whole top-left index is in the open (the centre and inner corners of the number and the suit);
- the later card lies on top;
- the hand and the info board are clear, no trick card lies over a plate, and there is no horizontal scroll;
- since round 3, the top and bottom margins are equal: 8.3 / 8.3, 19.7 / 19.3 and 3.7 / 3.7 px. In portrait the driver reached one full trick in the final run.

Round 4 was rechecked with `tmp/rw4.mjs`: at desktop, German and English, nothing in the side panel reaches past its edges, and the two pills are there.

**Effect on the AC:**
- AC 2 now reads: the whole top-left index of every card, whatever the order. It held.
- The other AC held after each round.

**Net effect against the handoff:**
- The trick steps up from left to right, centred in the frame, so every card's number and suit stay in the open.
- The side panel no longer overflows.
