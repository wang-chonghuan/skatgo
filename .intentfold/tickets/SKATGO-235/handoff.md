# SKATGO-235 handoff

## What changed

- `multiplayer/src/tables.ts` (new): the registry of live tables and `leaveOtherTables(store, account, except)`.
- `room.ts`: each table registers itself; `leaveFor(account)` takes the account out through the table's own queue, as
  its Leave does (`applyAction` 'leave', the League's settling and next deal), the old connection dismissed
  `elsewhere`, the room closed when nobody is left. Opening a room and entering one leave the other tables first
  instead of refusing `already_in_room`.
- `league.ts`: Play leaves the other tables instead of refusing; a table formed for someone who queued leaves any
  table they sat down at meanwhile.
- `store.ts`: `roomsOf` (every table, a League seat that was left not counted); `roomOf` its first.
- `referral.ts` / `app/src/lib/room-handler.ts`: no "elsewhere" pre-check and no 409 for a room number.
- Tests: `rooms.test.ts` (new table → old seat a computer's, old connection `elsewhere`; entering by number → the
  just-opened room closes), `league.test.ts` (seated at a private table, then Play → seated at the League, the private
  room closed), `room-handler.test.ts`. Charter: product.md, engineering.md.

## AC results

1. PASS — `rooms.test.ts`: opening a new room while seated; the old seat is a computer's for the other person.
2. PASS — `league.test.ts` and the browser run: seated at a private table (page closed), League Play seats at a League
   table, the private table lets go.
3. PASS — browser run: from the League table, a new private table opens; the League seat is `leaving`.
4. PASS — `rooms.test.ts`: entering another room by number while seated; the old room (now empty) closes.
5. PASS — the other person sees `ai` in the seat; the old connection gets `dismissed: elsewhere`.
6. PASS — no code answers `already_in_room` any more (the browser keeps its old wording for an older server).

Mechanical defence passed; multiplayer `rooms` (26), `league` and the web's handler tests pass.

## For the human

- Leaving a League table this way during a deal counts as leaving it: that deal is lost (the League's rule).
- Deploy order: multiplayer first, then web. No env change.
