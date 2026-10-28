# SKATGO-148 rework

Ten rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「lina 重新画，目前的攻击性太强……衣服红色，围巾浅蓝色，头发棕黄色，皮肤白一点」** (2fdaadb). Lina's three faces redrawn
   from Noah's style: friendly, red sweater, light-blue scarf, brown-blond hair, fairer skin. Rechecked: the six faces
   on one sheet, the new pictures served.
2. **「最后谁赢了也要笑，和不高兴。分庄家和2个防家。」** (947d615). At the deal's end the winning side laughs and the losing
   side sulks, declarer against the two defenders, for 1.5s. Rechecked: face unit test (7); one deal in the browser.
3. **「最后结算页面，那个公式占用的行数太多」** (086d93e). The calculation in two rows: "Grand 24 × 3 (with 1 + game 1 +
   Schneider 1)" 72, then the outcome ("Lina won: 72 + 50" +122); the "Your score" row gone (the title's). Rechecked:
   settlement unit tests; the card on desktop.
4. **「每个人的得分，也不该占两行」** (c53e713). Each seat's name and score on one line. Rechecked: the card on desktop.
5. **「ai的牌的尺寸应该和玩家的牌的尺寸，桌面的牌的尺寸一样，只不过ai的牌只显示半截而已」** (e0e8e51). Lina's and Noah's
   cards 130u / 96u like the hand's, half on the felt (54u on a phone, clear of the plate); the faces' room grown to
   match. Rechecked: side card 168×120 vs hand 120×168 at 1280×820, 126×90 vs 90×126 at 375×812; no overlap there and
   at 375×667.
6. **「整个的字体，都太细了……加粗」** (4beccc3). Every weight one step heavier: text 600, ui 700, bold 800, extrabold 900.
   Rechecked: computed weights on the table (600–800), no overflow in the board, plates, buttons; tests and SEO check.
7. **「……头像位置往上面移动一点，这样就不当着亮的牌了」** (1d117e0). Faces never hide: on a wide table at 72px in the
   felt's corner beside the board, clear of a ten-card open hand; drawn under the stacks, so on a phone an open hand
   lies over a face. Rechecked: no overlap with the way out or the board at 1280×820.
8. **「然后你再试试给头像家白色圆角背景。正方形，刚好框住就行」** (11d3661). Each face on a white `radii.panel` square as
   large as the picture. Rechecked: desktop and phone screenshots.
9. **「头像有点大，应该小点」** (baab833). Faces 92u (85px at 1280×820), 72u in portrait. Rechecked: no overlap at both.
10. **「手机上65吧」** (5409653). Faces 69u in portrait, 64.7px at 375×812. Rechecked: no overlap.

Net effect: aligned result rows and trick label, faces that fade after 1.5s and react at the deal's end, a comic
talk bubble, a friendlier Lina, a two-row calculation with one-line seat scores, opponents' cards as big as the
player's, heavier type across the site, and faces on white squares (85px desktop, 65px phone) placed clear of open
hands. Mechanical defence passed once on the final branch (295 tests).
