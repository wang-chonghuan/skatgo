# SKATGO-157 handoff

## What changed

- **`ui.tsx` `Modal`**: right padding 8, head and body right padding 16. The scroll bar now sits 8px from the edge; the content and the close button stay 24px in.
- **`game-table.tsx` `Dialog`**:
  - The plain dialog has right padding 8 and its inner body right padding 16.
  - The framed dialog (the result with "Next deal") has its body 8px from the top and right, with content padding making up the 24. The bar clears the 21.6px corner.
- **ui.md** `Modal` row updated.
- No tokens added.

## AC results

1. **PASS** for every dialog reachable without playing.
   - `tmp/scroll.mjs`: cheat sheet, all questions and settings, at phone 375×640 and PC 1280×600. In all six the bar is 8px from the edge, the content and the close button 24px, and the box does not scroll.
   - The table's result dialog has the same arrangement in code. It is the human's look after a deal on the preview, since acceptance plays no game.
2. **PASS.** Mechanical defence: typecheck, build, 306 tests, bundle, tokens, literal grep, SSR link, `check:seo --built` and `test:seo`.

## Deviations

None.

## Environment

- Ports: web 55157, multiplayer 56157, database 57157.
- The local database container `skatgo-multiplayer-db-57157` was created by this ticket and is removed at close.
- No env keys changed.

## Residual

None.

## Check

1. Play one deal at http://localhost:55157/en/play: the result dialog's scroll bar sits close to the edge, with no blank strip.

## Decided for you

- The gap between the scroll bar and the edge is 8px.
