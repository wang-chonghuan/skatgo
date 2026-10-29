# SKATGO-155 handoff

## What changed

- `game-table.tsx` `styles.face`: the faces' square keeps its size (`stage.face`) and corners (`radii.panel`); its
  background is the info board's dark see-through `color.board` (black at 32%) instead of white `color.surface`.
- Charter `ui.md`: the faces' paragraph says so.

## AC results

1. **Dark see-through square** — pass. Computed background `rgba(0, 0, 0, 0.32)` on both faces at 1280×820 and
   375×812; the felt shows through (`tmp/desktop.jpg`, `tmp/phone.png`).
2. **Same size and place, no overlap** — pass. 1280×820: 85px at top 72 (x 4 and 833); 375×812: 65px at top 236; no
   intersection with cards, stack cards, the frame, the info board, the table's line or any button.

## Deviations

None.

## Environment

Ports: web 55155, multiplayer 56155, database 57155. No env keys changed.

## Residual

None.

## Check

1. The dark square behind each face on the computer and on a phone.

## Decided for you

- The dark see-through is the info board's own colour (black at 32%); corners stay 12px as the white box had.
