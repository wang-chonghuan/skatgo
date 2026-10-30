# SKATGO-163 handoff

## What changed

- **Rooms instead of invite links.**
  - A room is opened from the friends page and plays at once: its host beside two computers.
  - It has a six-digit number, which is its id and address: `/table/<number>`, `/de/tisch/<number>`.
  - Others come in with the number or the link and take a computer's seat. While a game is played they wait for the next one (the computer finishes it), then start at 0.
  - With three people the number lets nobody in ("This room is full.").
- **Every seat is an account's.**
  - The browser stores nothing. Coming back is entering the room again, from any device, and a second connection of the same account takes over from the first.
  - An account is in one room at a time, and people sit under the leaderboard name (`nameOf`).
- **Away seats, removing, leaving.**
  - The seat of someone away past the 30 s grace may be taken by a newcomer, a computer's seat first.
  - The host removes a person from the table menu; the seat goes to a computer, and the person may come straight back.
  - Leaving passes the host role to the next person in seat order. The last one leaving closes the room and frees its number.
  - With nobody online the computers do not play.
- **multiplayer.**
  - `model.ts`: snapshot schema 3, `newRoom`, `freeSeat`, `claimSeat`, `kick`/`leave`, `joinsAt`.
  - `room.ts`: admission by account, the number drawn on create, claim/resume, dismissal with a reason, closing, the pause.
  - `store.ts`: `roomOf`, `drop`, unique numbers. Its migration deletes schema-2 rows.
  - `referral.ts`:
    - `/rooms/mine` and `/rooms/<number>` (status for an account);
    - referral by the account's seat;
    - the start action is replaced by room-only actions in the other routes.
- **web.**
  - `room-ticket.ts`: tickets v2 name the account; a join also names the room.
  - `room-code.ts`: the number's shape.
  - `room-handler.ts`:
    - `/api/room/ticket` asks the service before signing a join;
    - wrong numbers are limited to 10 a minute per account;
    - `/api/room/mine` is new;
    - referral by room.
  - `room-client.ts` is rewritten: `openRoom`, `enterRoom`, `findRoom`, `myRoom`.
  - `table-room.tsx`:
    - `RoomCards`: New room / Join room, or Back to room. A guest's tap opens Clerk first, then goes on.
    - `PrivateTable`: sign-in first, join by number. Removed, elsewhere and closed lines.
    - Joins only while the browser is at the room's address.
  - `game-table.tsx`:
    - the number at the felt's top left, mirroring the way out (a pill on a wide felt, the round button with two rows of three digits on a phone);
    - a tap copies the link and "Link copied" shows under it;
    - the menu gains Remove <name> (host) and Leave the room, each asked once more.
  - `ui.tsx`: `TextField` takes `digits` (the number pad).
  - Messages en/de: new `room_*` keys, the old lobby keys removed. The home card, the friends page, About and the meta description no longer say "join with just a name".
- **Charter:**
  - `product.md`: the private-table paragraph, now the rooms, with the human's words;
  - `ui.md`: the friends page and the table's number and menu;
  - `engineering.md`: the files row and the way-in decision;
  - `operations.md`: runtime, and deploy order (multiplayer first).
- **Tests:**
  - `multiplayer/test/rooms.test.ts` rewritten for accounts. 22 cases: admission, numbers, claiming, full, one room per account, another device, kick, leave, close, pause, away seat taken, referral, the old checks (privacy, takeover, restart, fencing), and old tables ended at start.
  - `room-handler.test.ts` and `room-view.test.ts` updated.

## AC results

Ticket services: web 55163 (built, `SKATGO_TEST_ACCOUNTS=1`), multiplayer 56163, Postgres 57163. Headed Chromium, `tmp/accept.mjs`, 29/29 (`tmp/accept.txt`).

1. **Two cards — pass.** Signed in: New room and Join room. A guest tapping a card gets Clerk's sign-in window.
2. **A new room — pass.**
   - Opening one leads to `/en/table/<6 digits>`, with the first game dealt and the controls human, AI, AI.
   - The number button stands at the top left, the exit button's mirror (same size and height on a phone).
   - A tap puts `…/en/table/<number>` on the clipboard and shows "Link copied".
3. **A second account joins — pass.**
   - It sits in seat 1 and is told "You play from the next game."
   - Playing from the next game at 0 is proven by `rooms.test.ts` ("newcomers take the computers' seats and play from the next deal, from 0"). Acceptance does not play games out.
4. **A third and a fourth — pass.** The third takes seat 2; the fourth gets "This room is full."
5. **Wrong numbers — pass.** "There's no room with this number."; after 10 wrong ones in a minute, "Too many tries – wait a minute."
6. **Back to room — pass.** Only "Back to the room" is shown; it returns to seat 0. The first device is told "This room is open on another device."
7. **An away seat is taken — pass.** B's page closed; after 33 s, D took B's seat, and B's friends page shows two cards.
8. **Removing — pass.** The host's menu offers Remove per person. The removed person reads "The host removed you." and is back in with "Join again".
9. **Leaving — pass.**
   - The host leaves to two cards, and the next person becomes host.
   - After the last one leaves, the number is "no room".
   - Also in `rooms.test.ts`: the room row is deleted.
10. **The pause — pass**, by `rooms.test.ts` ("with nobody online the computers wait…"): the revision stays put for 1.5 s with every connection closed.
11. **Referral — pass.** A new test account (created now) joined, and `account_referrals` holds (its account, the host, the room). Covered in `rooms.test.ts` too.
12. **Both languages — pass.** German cards ("Neuer Raum", "Raum beitreten"); the German table at `/de/tisch/<n>` reads "Raum …" and "Du spielst ab dem nächsten Spiel mit."

Mechanical defence on the final code: typecheck, build, 320 tests, client bundle, design tokens, grep 0, SSR link, check:seo, test:seo. `npm --prefix multiplayer run check`: 41/41, the room test against the ticket's local Postgres.

## Deviations

- **The number button.** Draft: a pill everywhere. On a phone the info board leaves only the way out's 44 px corner, so it is the round button with two rows of three digits there; on a wide felt it is the pill. The fresh-eyes look found the round one reads less clearly as a number.
- **Seat taking.** Draft: an away seat is taken only from people already playing. Any person away past the grace now counts, a waiting newcomer included. Otherwise a newcomer who closed the page would hold the seat until a game ends.

## Environment

- **Ports:** web 55163, multiplayer 56163, Postgres 57163 (container `skatgo-multiplayer-db-57163`, profile `colima-skatgo`, made for this ticket).
- **Env keys:** none added, changed or removed.

## Residual

- At deploy: back up and count the schema-2 tables before the migration deletes them.
- At deploy: deploy multiplayer first, then web. Until web is live, rooms cannot be opened or entered.

## Check

1. **The number button on a phone.** It is a round button with "746" over "121" at the top left, because the board leaves no room for a pill. Is that clear enough?
2. **The friends page cards.** New room / Join room, and Back to room while you are in one.
3. **Joining with the number from a second account.** "You play from the next game.", and your name without "(AI)".
4. **The host's menu.** Remove <name>, Leave the room.

## Decided for you

- **Newcomers wait for the next game.** They play from it, start at 0, and see no cards of the game the AI finishes for them.
- **Which seat a newcomer takes.** A computer's first, else the person away longest, after the 30 s grace.
- **Removed people may come back.** No ban, as you said.
- **Leaving and closing.** Leaving passes the host to the next person in seat order; the last one leaving closes the room.
- **The pause.** With nobody online the AI does not play on.
- **One room per account.** Opening the same room on another device takes the seat over from the first.
- **Wrong numbers.** 10 wrong numbers a minute per account.
- **Room numbers.** Random from 100000 to 999999, unique among live rooms.
- **Old tables.** They end at the deploy (migration), after a backup.
- **Copy that said "join with just a name".** Corrected on the home card, the friends page, About and the meta description.
