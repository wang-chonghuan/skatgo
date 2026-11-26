# SKATGO-246 handoff

## What changed
- multiplayer/src/room.ts: a private room's host seat, a newcomer's seat and a person coming back to their seat carry the account's stored face (`faceOfPlayer`, now exported from league.ts). Live rooms from before this release get faces as people come back.
- app/src/components/skat/table-room.tsx `Playing`: the left and right opponents' pictures — a person's face or the drawing of their name, a computer's the drawing of "Lina"/"Max" — passed to `GameTable` as `room.faces`, which draws them still in the faces' places as at League tables.
- game-table.tsx comment; charter ui.md faces paragraph (no longer "not a private table") and the League faces sentence widened to private tables.
- multiplayer/test/rooms.test.ts: a joining account's stored face reaches its public seat; the host without one has null.

## AC results
1. Faces at a private table — :55246, host A (own look), friend B (none), one computer: A's table shows `skat-face-1` B's drawing ("Blauer Luchs") and `skat-face-2` the computer's ("Lina"), both `data-face="still"`, `?square`; B's shows Lina and A's own look. Same `StillFace` and styles as League (SKATGO-238 measured them identical). Pass.
2. A person's own avatar — B's table shows A's stored look `look-a-…`. Pass.
3. Computer and newcomer — C took the computer's seat mid-deal; A's right face changed to C's look `look-c-…` at once. Pass.
4. Other tables — free play's, League's and the daily table's code paths untouched (GameTable unchanged but a comment); defence green. Pass.

Mechanical defence: app typecheck, build, test, client bundle, design tokens, git grep, SSR link, check:seo --built, test:seo — exit 0; `npm --prefix multiplayer run check` 71/71.

## Deviations
None from plan.md.

## Environment
Ports: web 55246, multiplayer 56246, DB 57246. No env keys added, changed or removed.

## Residual
None.

## Check
1. A private table with a friend — the two opponents' boxes left and right at the top of the table.

## Decided for you
- A computer's seat shows the drawing of its name (Lina / Max), the same drawn style as people, not free play's sticker faces.
- A new look someone picks while in a room shows from their next coming in.
- The settings' faces switch (Lina's and Noah's) does not hide these, as at League tables.
