# SKATGO-234 rework

Five asks after the handoff, each its own commit (one ask undone by the next).

## 1. Bidding first, bidding and endgames in colour (6b1da05)

The human: 「bidding practice应该放到最高，然后bidding和endgame应该高亮，用主题色系列来显示，因为它们内容最多最重要」

- Skat Tricks lists the bidding practice first (1) and the open-card endgames second (2); their heads in the front
  page's tile colours, bidding `tileNavy`, endgames `tileGreen` (the whole card while closed), white words, a white
  number with the colour's digit. Rechecked: order and colours on PC, phone and German; no sideways scroll.

## 2. The Advanced course card's picture (06b5505, 2db4788)

The human: 「adv course的图片不行，你要有点想象力，别搞的跟其他的一样，都是个桌子」, then 「第一个可以，但是不要老人，要两个人，
一个老头，一个年轻人」, then 「要一男一女那个版本」.

- Three new pictures without a table (staircase of cards, balloon, stargazer); the staircase redrawn with two
  climbers; the human chose the young woman leading an older man. Cropped to the card, `advanced-card.webp`. Drafts
  and prompts in the main checkout's `.intentfold/tmp/SKATGO-234/course-card/`. Rechecked: the front page's cards.

## 3. The forum's search folded, then undone (54395df, 6251dc4)

The human: 「论坛里搜索框我觉得没啥用，要不去掉？或者是点击了放大镜展开一条线的……」, then 「不行，改丑了，回撤这个搜索的改动」.

- The search folded behind a magnifier, then reverted exactly; the forum's search stands as at the handoff.

## 4. Smaller report and hide buttons (7a34c16)

The human: 「举报和屏蔽的按钮太大了，很丑」

- The forum's report, delete, hide and restore buttons are bare 16px icons: no circle or line, `slate`, `navy` under
  the pointer, a 24px hit area (`dims.iconButtonSm`, 32px before), a `page` ground while open. Rechecked: a post and a
  comment as the official, PC and phone.

## Net effect against the handoff

Everything in handoff.md stands; the Skat Tricks' order (bidding first) and colours, the card's picture, and the
forum's icon buttons are as above.
