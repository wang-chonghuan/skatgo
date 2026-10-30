# SKATGO-157 rework

Four rounds after the handoff, each committed once with the human's ask as the commit's first line. The third was
reverted by the fourth.

1. 「对话泡泡怎么跑到屏幕中间了？泡泡要始终从头像的同水平线的位置发出去，挨着头像」
   - Lina's and Noah's table talk no longer follows the trick frame on a wide table, nor the top band on a narrow
     one. It is drawn on the felt beside the speaker's face on every screen: its top level with the face's top
     (`stage.faceTop`), 8 px in from the face (`stage.talkBeside`), at most `stage.talkMax` wide. With the faces off it
     stands where the face would be.
   - The tail comes out of the bubble's side at the face. The old band row, the beside-the-frame placement and their
     styles are gone, and so is `stage.talkBetweenFaces`, now folded into `talkMax`. ui.md says so.
   - Rechecked: typecheck, build and tests. The placement was checked by its tokens, face inset + face + 8 px in both
     orientations, because the talk appears only in a game and acceptance plays none.
2. 「free play的时候那个叫牌的帮助，如何能加，减少玩家技术性的负担，但是不减少思维的挑战。」, then 「你先push一下，然后本工单做，做出来我看看，设计要简洁」
   - Free play's bidding drawer gets a bid calculator under the bid's buttons: "Game value" and the contracts as
     toggles (♦ ♥ ♠ ♣ Grand Null). A picked one counts its value with the ten cards in hand, e.g. "without 4 · 5 × 24 =
     **120** · Hand 144", or Null's four fixed values. It never says which contract, whether to bid or how high.
   - The contract stays picked through the deal's bidding. It shows only at free play's table (a round). A settings
     switch, on by default, turns it off.
   - product.md records it as the one exception to SKATGO-130's "free play like the tournament". ui.md describes it.
   - Rechecked: on the preview at 1280 px and 390 px, ♣ (without 5 → 72, Hand 84) and Grand (without 4 → 120, Hand
     144) against the hand, the row wrapping on the phone. Tests and the token check passed.
3. 「higher旁边做一个小的计算器的图标，点了才能打开这一行。然后without 4 · 5 × 24 = 120 · Hand 144 你这个中间用点，令人奇怪，换个形式」
   - Added a calculator button beside "Higher …" and reworded the line. On a phone the bid buttons took md's side
     padding so the button fitted.
4. 「不要计算器按钮了，然后算式也还用之前的，都还原，按钮样式你也禁止动」
   - Round 3 reverted whole. The tree equals round 2's.

Net effect against the frozen handoff: the dialogs' scroll bar is as handed off, the table talk stands beside the
speaker's face, and free play has the bid calculator of round 2.
