# SKATGO-158 grill

The human said 「不要问我问题了」 at the start of development, so every question is self-decided. None reaches the
human.

## Decided for you

1. **What "回到加头像前的位置和大小" covers.** The frame's and the stacks' place, and the table's scale `u`. The stacks'
   cards keep SKATGO-148's size, chosen by the human (「ai的牌的尺寸应该和玩家的牌的尺寸……一样」); that was not part of the
   faces change. Basis: the request names position and size against the faces change.
2. **Clearance measured from a ten-card stack, not twelve.** Twelve would still move the 369×664 phone. An opponent
   holds twelve only while picking up the skat, and the stack is then drawn over the face's foot for that moment.
   Basis: 「不到迫不得已，禁止动这个背景板」.
3. **Faces under the board's foot in portrait, not beside it.** The board leaves 60px a side, and a face with its
   inset needs 73u, more than 60px on every common phone. The face's top may touch the board's foot (no gap), so the
   369×664 phone does not move.
4. **The table's geometry does not depend on the faces setting.** Toggling faces must not move the table (AC 2), and
   one geometry is simpler.
5. **The frame stays after the stacks in the DOM.** Putting the whole frame first would also put the trick cards
   under the stacks and faces, and they fly in from the stacks. The plates and the skat go under the trick cards, as
   reported. Stacks and faces never reach the frame in this layout.
6. **Messages and the line under the board may lie over a face's edge or the talk bubble for a moment.** The human
   accepted this cost in the agreed proposal: 「出错提示……可能短暂盖住头像的边缘」.
