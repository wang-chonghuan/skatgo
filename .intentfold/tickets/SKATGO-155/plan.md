# SKATGO-155 plan

## What the code says that the ticket does not

- The face's box (`styles.face` in `game-table.tsx`) is `stage.face` square, `radii.panel` corners, `color.surface`
  background, overflow hidden; the picture fills it.
- The info board on the felt is `color.board` (black at 32%) — the table's existing dark translucent surface.

## Route

1. `styles.face`: `backgroundColor: color.board` instead of `color.surface`; size, corners, place unchanged.
2. Charter `ui.md`: the faces' paragraph says dark translucent square.

Checks: build, typecheck, tokens; the table at 1280×820 and 375×812 measured and looked at.
