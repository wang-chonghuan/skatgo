# SKATGO-239 handoff

## What changed
- `app/src/lib/forum-handler.ts`: the table's square avatar variant (`?square`, asked only by the League table) draws no
  ground (`transparent`), so the face box's dark see-through square (`color.board`) shows as behind Lina and Noah, and
  draws the person at 80 % lowered by 10 so the shoulders meet the box's foot (`TABLE`). The box is unchanged.
- Charter ui.md, the League faces sentence.

## AC results
1. PASS — running product (55239), League table vs two personas at 1440×900: both opponents on the dark square, no light
   tint; free play's Lina and Noah beside it for comparison (`tmp/pos-league-1440x900.png`, `tmp/pos-free-1440x900.png`).
2. PASS — the person visibly smaller in the box than SKATGO-238's; boxes measured equal to free play's at 844×390
   (40 px at 2/802, 72), 390×844 (67 px at 4/319, 229) and 1440×900 (96 px at 4/940, 72).
3. PASS — the round drawing (no `?square`) is byte-identical to production's (`jule_94.svg`, same SHA-1); 366 app tests
   pass, forum's included.

Mechanical defence: typecheck, build, 366 tests, client bundle, design tokens, no raw styles, SSR link, check:seo
--built, test:seo — pass.

## Deviations
None.

## Environment
Ports: web 55239, multiplayer 56239, database 57239. No env keys added, changed or removed.

## Residual
None.

## Check
1. A League table on the phone — the avatars' size and dark ground.

## Decided for you
- "Like the other avatars" = the dark see-through square behind Lina and Noah.
- Smaller = the person at 80 % inside the same box, so the box keeps free play's place and size.
- An uploaded photo still fills the box (it brings its own background).
- Boards, forum and profile keep the round tinted drawing.
