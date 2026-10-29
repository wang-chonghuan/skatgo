# SKATGO-156 rework

One round after the handoff, committed once with the human's ask as the commit's first line.

1. 「所有的弹窗，都要让滚动条在弹窗内部，而不是贴道外部」
   - Every dialog's body scrolls and the box does not, so the scroll bar stands inside the dialog's 24 px padding instead of on its edge. Two places had to change:
     - **`Modal`** (cheat sheet, all questions, settings, the Elo board's explanation): a body wrapper with the scroll; the box `overflow: hidden`.
     - **The table's `Dialog`** (`game-table.tsx`): the plain dialog's children are in an inset scroll body. The framed one's body is inset by its inline margin, and the foot stays full width.
   - ui.md's `Modal` row now carries the rule.
   - Rechecked:
     - `tmp/scroll.mjs`: cheat sheet, all questions and settings, at phone 375×640 and PC 1280×600. In all six the box does not scroll and the scroller is inset 24 px.
     - The ticket's acceptance script passes 15/15 and the bidding practice regression 10/10.
     - The regression's tile check failed three times at 390 px in the headed browser. The desktop pointer rested on the tile and lifted it 3 px on hover. A headless measure and a later headed run show the tiles aligned locally and in production.
     - The table's result dialog was checked by code only, since acceptance plays no game.

Net effect against the frozen handoff: every dialog scrolls inside its padding. The rest is as handed off.
