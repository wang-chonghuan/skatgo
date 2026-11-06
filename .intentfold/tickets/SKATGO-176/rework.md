# SKATGO-176 rework

Four rounds after the first delivery, each its own commit with the human's ask as its first line.

1. 「搞笑吗，这个点了应该显示一个表，就是这幅牌能叫到多少分，每个合约，就是一个弹窗」 — the bidding hint in free play no
   longer gives the course's one-line advice ("This hand isn't strong enough…") but opens a dialog
   (`components/skat/bid-values.tsx`, kit `Modal`): one row per contract (♦ ♥ ♠ ♣ Grand, Null, Null Ouvert) with
   Matadors, Bid up to and Hand; suit glyphs in their colours (`Rich`); one slate line that it counts the ten cards in hand.
   New messages `bidvalues_*` (en, de). Rechecked: the dialog opens with 7 rows and closes, both viewports.
2. 「with 3后面不该跟一个点，应该跟个冒号」 — the Matadors cell reads "with 3: 4 × 12". Rechecked: the rows' text.
3. 「我希望这个东西不要放到蓝色按钮，应该放到和右边抽屉标签对称的左边的标签，这个标签打开后，能显示这个叫牌分表」 — free play's
   bidding drawer has no blue hint button (`bidHints` false where the table has a round); a tab on the felt's left edge
   opens the table while bidding. Rechecked: no blue button, the tab on top of the drawer, the dialog opens, both viewports.
4. 「这个标签不能是同样样子的标签，应该改成一个灯泡图标的，然后颜色最好也不要是白色……」 — that tab is the hint's own
   dark lightbulb tab (`styles.hintTab`, over the drawer), the same as while playing a card. Rechecked as round 3.

Net effect against the frozen handoff: in free play the left-edge lightbulb tab is the hint in both phases — while
bidding it opens every contract's value for the hand, while playing it gives the card hint; the bidding drawer has no
hint button; the skat and declare hint buttons are unchanged. Charter (`product.md`, `ui.md`) amended in each round.
