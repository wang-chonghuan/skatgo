# SKATGO-142 rework

Three rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「触发的不行，有些只有1次，有些2次。你重新思考。我觉得对手赢牌，或者输牌时，说一句即可，叫赢了也可以说，总共不超过3次」**, then
   「叫牌结束用说吗，你独立思考」 and 「同意，改」 (a0d97ab). Every moment had to be worth a word, so quiet deals had one or two
   lines, and a moment sharing a reply with another was lost. Now three lines a deal while it is played: the bidding just
   won when it is worth a word (the player won it, bid too high or passed too early by SkatZero, or it reached 30), then
   tricks Lina or Noah took or lost in windows (after a bidding line tricks 2–4 and 5–9, else 1–2, 3–5, 6–9): in each the
   first trick worth a word or the window's last; a missed moment is found again in its window; a deal claimed early gets
   one line on the claim; the speaker fixed by the moment. Rechecked: `talk.test.ts` (with no card judged, every deal
   played to its end talks three times), 60 pool deals (all played to trick 9 talked three times; two claimed at trick
   3–4 twice), the bidding line at the table in both languages.
2. **「弹出后，我建议最好让用户点一下屏幕再给让这个泡泡消失，然后泡泡上最好显示一个那个手指标志……你判断和决策」** (83cc304). The
   line stays until the next tap anywhere, which still plays the card or collects the trick; in its corner the trick's
   blinking hand at half size (`dims.talkHand`, new). Rechecked: PC and phone, still there after 8 s, gone after a tap.
3. **「可以，然后锦标赛也加进去，1deal和6deal都加」** (fa1f874). The daily tournament's tables talk too: `POST /daily/talk` reads
   the deal in progress from the player's entry, SkatZero's bid for the hand from the AI's own game of the deal; one
   browser hook for both tables; the switch reads "Lina and Noah talk at the table". Rechecked: the deal of the day as a
   guest talked after the bidding; the six deals asked with size 6 and answered — today's first deal's bidding is no
   moment by the rules (everyone passed, the AI in the player's seat too), its play lines left to the human's play.

Net effect: three lines a deal at free play and both daily tables, while the deal is played, each until a tap.
