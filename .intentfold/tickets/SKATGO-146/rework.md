# SKATGO-146 rework

Five rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「You这个不用加白色的框」** (b9c4518). The player's cell in `SeatScores` lost its white box; the three cells look
   alike and "You" names the player's. Charter ui.md says "named "You" and not boxed". Rechecked: the result dialog on
   a phone.
2. **「生成碎碎念的prompt，不要提及SkatZero这个东西，如果AI要自指，用I就行了」** (2cc1451). The facts sent to the model for
   Lina's and Noah's talk say "more than I would bid", "by my measure" instead of naming SkatZero, and the prompt tells
   the model the judgement is the speaker's own and never to name a program or an engine. Charter product.md updated.
   Rechecked: the multiplayer check (32/32, talk facts included).
3. **「这里这个game value，应该把叫牌的合约的分数也显示出来，比如grand是几分。你目前没说明」** (6e7dd7b). The result card's
   first step names the contract's base value: "Grand, base value 24" / "Grand, Grundwert 24". Rechecked: the
   settlement-row unit tests.
4. **「滚动条要放在modal的内部……next deal button应该固定在modal的下面，覆盖滚动区域」** (fbae3bd). `Dialog` takes a `foot`:
   against the AI the dialog's body is its own scroll area inside the rounded box, and Next deal sits in a foot under
   a hairline rule at the dialog's bottom; the sticky button is gone. Charter ui.md updated. Rechecked: 375×812, body
   705px in a 655px scroll area, foot flush with the dialog's bottom.
5. **「这个要写出来，否则人家不知道这50哪来的」** (3b5106d). When Lina or Noah wins as declarer the row shows the 50:
   "Noah won  120 + 50 = +170". Rechecked: the settlement-row unit tests.

Also observed in review: no table talk on the local preview, because the ticket's multiplayer was started without
the model settings; restarted with them, no code change.

Net effect: the result dialog in app roles at 16px with each seat's score, its calculation explained from the
contract's base value to the +50, scrolling inside its own box with Next deal pinned at the foot; the talk prompt
speaks the judgement as the speaker's own. Mechanical defence and the multiplayer check passed once on the final
branch.
