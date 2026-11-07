# SKATGO-178 rework

Since the first delivery (59ae4c5):

1. **「胜率列有点没对齐，要垂直对齐，否则不好看」** (68ad834). The win rate and the XP each stand in a column of their own
   width (`space.x48`), right-aligned on tabular digits, in `xp-board.tsx`. Rechecked at 1280×820 and 375×812 on the
   production build: every row's win rate ends at one x (1085 / 270) and every XP at one x (1145 / 330), no overflow,
   CSS 200; typecheck, build and the token check pass.

Net effect against the handoff: the board's two figures line up row to row; nothing else changed.
