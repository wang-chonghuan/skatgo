# SKATGO-163 plan

Route as agreed in `draft.md`. What the code promised that the ticket does not say:
- **Rooms already persist and restore across deploys** (`store.all()`, schema 2 only). Schema 3 must restore
  the same way.
- **The table waits 30 s for a dropped person** (`GRACE_MS`), then a computer plays (`autopilot`). That is
  "AI 代打", reused as is.
- **`next` (the next deal) is pressed by a person at the table.** A newcomer waiting for the next deal must be
  able to press it, or a table of one newcomer and computers would stall.
- **Room capacity is 128 live rooms** (`store.create`), unchanged.
- **The 24 h TTL is unchanged.**

## Slices, in order
1. `app/src/lib/room-ticket.ts`: claims `{ purpose: 'open', user } | { purpose: 'join', user, room }`.
2. `multiplayer/src/model.ts`, `room.ts`, `store.ts`, `referral.ts`, `server.ts`:
   - schema 3 and the six-digit number;
   - the account's seat, claim and resume, `joinsAt`;
   - `kick`, `leave`, host hand-over, closing the room;
   - pause with nobody online;
   - `/rooms/:code` (status for an account) and `/rooms/mine`;
   - referral by account;
   - the migration removes schema-2 rows.
3. `app/src/lib/room-handler.ts`:
   - tickets need an account, and a join names the room;
   - per-account wrong-number limit;
   - `/api/room/mine`;
   - referral by room.
4. `app/src/lib/skat/room-view.ts`: seats without "empty". `host`, `joining`, `me`; no `started`/`humanSeats`.
5. `app/src/lib/room-client.ts`: `openRoom()`, `enterRoom(code)`, `myRoom()`, `findRoom(code)`. No localStorage.
6. Pages:
   - `friends-page.tsx` / `table-room.tsx`: the cards, Back to room, sign-in first, the table straight away, the
     waiting line;
   - `game-table.tsx`: the room number at the top left (copy link), the menu's Leave room and Remove.
7. Messages en/de. `product.md` (the human asked), `ui.md` and `engineering.md` updated.
8. Tests:
   - `multiplayer/test/rooms.test.ts` rewritten for accounts;
   - room-handler, room-ticket and room-view tests.
