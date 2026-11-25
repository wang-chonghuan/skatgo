# SKATGO-235 plan

## What the code already promises, and what the ticket does not say

- One table at a time (SKATGO-163): `store.roomOf(account)` finds a live room whose seats name the account, and four
  places refuse with `already_in_room` — opening a room (`room.ts` onCreate), entering one (`room.ts` onJoin), the
  web's ticket for a room number (`referral.ts` `/rooms/:code` `elsewhere` → `room-handler.ts` 409), and the League
  (`league.ts` `/play`, and again when a table forms).
- A seat is held until its person presses Leave: a person who just closes the page keeps it (a computer plays for
  them after the grace), until the room expires. That is the trap.
- A League seat that was left (`leaving`) still names the account until the next deal, so it blocks too.
- Rooms live in the leader process as Colyseus rooms, each with its own queue; a change to a room goes through its
  instance (`store.change` + `publish` + dismissing connections), never around it.

## Route

1. `multiplayer/src/tables.ts`: a registry of the live tables by number and `leaveOtherTables(store, account, except)`:
   every live table holding the account but `except` is asked to take it out, as its own Leave does.
2. `room.ts`: register/unregister each table; `leave(account)` on the table's queue — `applyAction(... 'leave')`, the
   League's settling and next deal as a command does, the old connection dismissed `elsewhere`, the room closed when empty.
   Opening and entering leave the other tables instead of refusing.
3. `store.ts`: `roomsOf` (all, not one), a League seat that was left not counted; `roomOf` the first of them.
4. `league.ts`: `/play` and a forming table leave the other tables instead of refusing.
5. `referral.ts` / `room-handler.ts`: no `elsewhere` pre-check, no 409.
6. Tests: `rooms.test.ts` (opening and entering take the account out of its old table), League test for `/play`,
   `room-handler.test.ts`. Charter: product.md / engineering.md's one-table rule.
