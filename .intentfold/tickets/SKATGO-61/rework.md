# SKATGO-61 rework

Changes after the first delivery (`handoff.md`, commit `5b900aa`), one commit per request.

1. **"首页怎么没入口呢，应该加一个卡片，可以用红色的，作为入口，放在当前那两个卡片后面"** (`e1a98fa`)
   - The front page gets a third colour tile, ♥: "Lieber mit Freunden?" / "Rather with friends?", with "Privaten Tisch eröffnen" leading to `/with-friends`. It comes after the course (♣) and free play (♠) tiles.
   - New tokens `color.tileRed` `#C8281A` and `elev.tileRed`. The human approved them on 2026-10-08 (ui.md Redline 1); the approval is recorded on the ticket.
   - In this first version the tile took the whole row.
2. **"不要全宽"** (`523de40`)
   - The tile sits in the two-column grid like the others: second row, left, on a desktop; one column on a phone.

Rechecked after each round:
- desktop 1280×820 and phone 375×812 screenshots of the tiles, no horizontal overflow, and the button reaching `/de/mit-freunden`;
- typecheck, build, the design-token check, the client-bundle check and `check:seo`.

The AC were not affected: the front page is not part of them.

Net effect against the handoff: one more way in, on the front page, and two registry values.
