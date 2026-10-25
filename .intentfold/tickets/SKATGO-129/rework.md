# SKATGO-129 rework

One round after the handoff (c4e68e0), net effect relative to the frozen handoff below.

1. **「最好加入两种算法的曲线图来对比，显示为什么saldo的更好」**, then the human's decision on how
   (「你让那个会话直接在工单里，给论坛增加加图片的功能，你让他做，你别管这个」): the forum had no pictures (product.md, by
   the human's earlier agreement), so this chore ticket now carries code, at the human's word; its type stays as filed.
   SkatGo's posts can show the site's own pictures: a line `![what it shows](name.svg)` is
   `/forum-images/<language>/name.svg` in the page's language (`lib/forum.ts` `parseBody`, `forumImagePath`;
   `forum-body.tsx`); in a player's post the line stays text. Two charts from the owner's own record, plain difference
   against SkatGo Saldo per day — the deals that tell something, and defence only — drawn per language by `charts.mjs`,
   made readable at phone width, placed in the article with a sentence each. product.md, ui.md and engineering.md
   follow. Rechecked: `forum.test.ts` (the mark, foreign or inline pictures refused, plain text), the local article at
   PC and phone in both languages (`tmp/shot.mjs`: both pictures load in the page's language, no sideways scroll), the
   mechanical defence.

Net effect: post 4 carries the two charts once the web is deployed and its text is replaced in production; the forum
shows pictures in SkatGo's posts only.
