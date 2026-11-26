# SKATGO-246 plan

## What the code already promises (not on the ticket)
- Private tables and League tables are the same room model (multiplayer/src/model.ts `Slot`, `publicView`); `Slot.face` and the public seat's `face` exist since SKATGO-238 but only League's table forming fills them.
- A private room's computer seats have no nickname; the page names them Lina and Max (`seatName` in table-room.tsx). A seat a person leaves or is kicked from becomes `computerSeat()`, which carries no face.
- `GameTable` already shows `room.faces` as still squares in the faces' places (`StillFace`), whatever the settings' faces switch says.
- A person's face is read once when they sit; a change of avatar mid-room shows from their next sit-down (League does the same).

## Route
1. multiplayer/src/league.ts: export `faceOfPlayer`.
2. multiplayer/src/room.ts: the host's seat at `newRoom`, a newcomer's at `claimSeat`, and a person coming back to their seat get `face = faceOfPlayer(account)` (coming back also fills rooms live before this release).
3. app/src/components/skat/table-room.tsx `Playing`: faces = for the left and right seats `facePath(seat.face, seat's name, true)` — a person's face or the drawing of their name; a computer's the drawing of "Lina"/"Max"; passed as `room.faces`.
4. Comments in game-table.tsx; charter ui.md faces paragraph ("not a private table") and the League sentence widened to private tables.
5. Test: multiplayer rooms test asserts a person's stored face reaches the public seat at a private table.

## Redlines lookup
No new table, migration, dependency or style; no production data touched.
