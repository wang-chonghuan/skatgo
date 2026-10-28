# SKATGO-148 handoff

## What changed

- `daily-comparison.tsx` — the "Bidding" grid on the first baseline: each row's tag(s) and score on its first line,
  however the words wrap; an alike row's two tags side by side. "On the table" without its card padding beside
  "You led".
- `game-table.tsx` `SeatFace` — a laugh or a sulk lasts at most 1.5s (`FACE_HOLD`), started once per moment (the
  won bidding, each trick), then neutral.
- `game-table.tsx` talk card — a comic tail in existing tokens (border triangle, `space.x8/x14/x16/x20`,
  `color.surface`): beside the frame from the bubble's top, up and out toward the speaker's face; in the phone's band
  out of the bubble's side toward the face beside it.
- Charter `ui.md`: the bidding rows, the trick label, the faces' 1.5s, the speech bubble.

## AC results

1. **Bidding rows** — pass. 375×812, two-row dialog: You tag middle 392 / first line 391 / score 391; AI 448 / 447 /
   447. Alike row: both tags side by side on "Passed" (`tmp/phone-dialog.jpg`, `tmp/phone-passed.jpg`).
2. **On the table** — pass. "On the table" top 654 = "You led" top 654; card rows unchanged.
3. **Faces ≤ 2s** — pass. One pass at 375×812, every non-neutral run logged: bid laugh 1513ms, trick faces
   1207–1211ms (the trick goes at 1.2s).
4. **Bubble pointing to the speaker** — pass. 1280×820: Lina's tail x 109–125, y 244–258 above the bubble toward her
   face (243 its bottom), no intersection (`tmp/desktop-bubble.png`). 375×812: Noah's tail x 289–297, y 223–239 out of
   the bubble's right side at his face; its tip reaches 4px into the transparent margin of his picture's box, over no
   drawn pixel (`tmp/phone-bubble.png`); no card, frame, plate or board touched.

## Deviations

- One development commit for the four items, not one per item; the phone tail followed in its own commit.
- After the human-eyes look, the phone tail points sideways at the face instead of down.

## Environment

Ports: web 55148, multiplayer 56148, database 57148. No env keys changed. Local multiplayer started with the model
settings from `app/.env`.

## Residual

None.

## Check

1. The talk bubble on the phone and on the computer — the tail's look and where it points.
2. The after-deal dialog on the phone — Bidding rows and "On the table".
3. The faces going back to neutral after a laugh or a sulk.

## Decided for you

- Faces hold 1.5s; a trick collected sooner (1.2s) ends them sooner.
- When you and the AI bid alike, the two tags stand side by side on the one line.
- The reviewer's other points not taken: the desktop bubble's distance to the frame and its 16px text are as
  SKATGO-143 set them.
