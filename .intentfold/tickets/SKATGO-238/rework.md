# SKATGO-238 rework

## Round 1 — 「默认的框不是方形吗，你他妈怎么改成圆形了？」
- Changed: the League table's avatars are drawn on a square ground (`/api/forum/avatar/a4/<seed>.svg?square`, DiceBear
  radius 0) so they fill free play's rounded-square face box; boards and forum keep the round picture; an uploaded
  picture is square already (`facePath(face, name, square)`).
- Rechecked: AC 3 — two test accounts seated together see each other's and the persona's avatars, now square
  (`?square` addresses, screenshot); the face boxes measured identical to free play's at 844×390, 390×844 and 1440×900;
  forum unit tests (13) pass.
- Net effect against the handoff: the "round drawing" item on the handoff's Check list is resolved — the avatars now look
  like free play's faces in shape as well as place.
