# SKATGO-26 rework

`handoff.md` froze at `e4271c8`. Everything after it came from the human's review of the running
table and front page, one commit per round, each commit message being the ask. Net effect relative to
the handoff: 23 files, +295 / −195.

## Rounds

1. **`afdf242`**. The ask: "三家出牌时应该这么显示…别放到方框里面；为什么你要错落呢…；这两张 skat 牌也太小了"
   (show the trick as in the reference image, keep the play-time words out of the frame, make the skat
   cards the size of the played cards).
   - The trick uses frame-relative proportions: each card is 26% of the frame's width.
   - The skat lies in the frame at that same size.
   - Whose move, the trick's winner, a refusal and a hint are said outside the frame: over it on a
     desk, under it on a phone.
2. **`01c695e`**. The ask: "primary 按钮里的字体大小可以不一样的？；为什么还不让玩家的牌居中呢" (buttons of one
   kind with different font sizes; centre the player's card).
   - Every button in the action drawer uses one button text style and height; the numerals face and
     the 32px Pass are gone.
   - "Sign in" in the public header takes the landing shape, like "Play".
   - The learner's trick card is centred.
3. **`ceb7735`**. The ask: "右边这张牌距离右边框的距离，和左边…不同？" (the two side cards sit at different
   distances from the frame). Both opponents' trick cards now use one shared inset.
4. **`561cad3`**. The ask: "叫牌弹窗中的按钮怎么不是左右居中呢？" (the bidding buttons are not centred).
   - The drawer's question and button rows are centred.
   - The drawer leaves at once, so it never lies over the words that follow it.
5. **`25c5e55`**. The ask: "这四个卡片尺寸为什么不一样；把…拟物图标去掉" (the four tiles differ in size;
   remove the emoji).
   - Front page: the group titles and all four tiles are one grid with 1fr tile rows, so the tiles are
     equal in height everywhere. A new exclusive tablet breakpoint (`bp.mid`) was added.
   - Lesson cards are equal in height, and one column below 1024px.
   - The emoji are gone from the interface, the nine UI strings and the lesson data, replaced by
     outline icons: lesson icons, a lightbulb for hints and tips, a check and a cross for verdicts.

## Criteria rechecked

- **AC3, the whole game** (`tmp/ac3.mjs`): rerun after every round, at 1280×820 and 375×812, with a
  defender game and a declarer game each reaching the settlement. The last run passed 24 checks.
- **AC2, the front page** (`tmp/ac2.mjs`): rerun after round 5 changed the tiles' structure. It passed
  16 checks.
- **AC4**: no new assets or Funbridge material was added. The rework added no binary files and no
  Funbridge text.
- **Measured facts**:
  - trick card centred (415 = 415 on a desk; 188 / 187 on a phone);
  - side trick insets equal (29 / 29 and 23 / 23);
  - drawer rows centred (equal left and right margins);
  - tile and lesson-card heights equal at 5 widths × 3 languages, with the content fitting;
  - no emoji on 15 rendered pages;
  - no horizontal overflow on 6 pages × 4 widths.
- **Mechanical defence** over the final branch: typecheck, build, 70 tests, client bundle, design
  tokens (60 files), literal grep, SSR import. All pass.
- **AC1** (matching the reference in detail) was confirmed by the human's approval to close.
