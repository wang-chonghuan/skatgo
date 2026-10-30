# SKATGO-163 draft — the approach agreed with the human

Discussed before development (three rounds, see the ticket's Request). The ticket holds the requirements and
acceptance criteria; this file holds only what the conversation decided beyond them and how it is built.

## What the conversation settled
- **First reading was wrong.** "1 or 3 people" and a lobby before the start were dropped. A room plays from the
  moment it is opened, two computers beside its host. People come in with the room's six-digit number and take
  a computer's seat.
- **A seat can be taken** while its person is away, once a computer plays it for them.
- **The host may remove a person, who may come straight back** (「踢了还可以自己加，基于信任」). No ban.
- **The room's number sits at the table's top left,** across from the way out; a tap copies the room's link.
- **The friends page shows two cards,** New room and Join room, or one card, Back to room, while the account
  is in a room.
- **Decided for the human and accepted with the plan:**
  - A newcomer plays from the next deal and starts at 0.
  - Computer seats are taken before an away person's seat.
  - Leaving hands the host role on.
  - With nobody online, the table pauses.
  - The wrong-number limit is 10 a minute per account.
  - Old tables are ended at the deploy, after a backup.

## How it is built (the route)
- **A seat belongs to an account** (`user:<id>`), not to a token kept in one browser. The browser stores
  nothing.
  - Coming back is joining your own room again, from any device.
  - The snapshot becomes schema 3: `id` is the six-digit number, and `host` is an account.
  - Each seat holds `account`, `nickname`, `session`, `disconnectedAt`, `autopilot`, and `joinsAt` (the deal a
    newcomer starts with).
  - The invite hash, seat tokens, `humanSeats` and the lobby go.
- **Admission tickets** (`room-ticket.ts`) always name the account. A join ticket also names the room, and the
  room checks it.
  - The web's `/api/room/ticket` asks the service about the number before issuing: no room, full, or member.
  - It counts wrong numbers per account.
  - `/api/room/mine` says which room the account is in, for "Back to room".
- **The service:**
  - `onCreate` picks a free number (the table's primary key keeps it unique), names the host with the account's
    current name (`nameOf`, the leaderboard name), and deals at once.
  - `onJoin` either resumes the account's own seat, or claims a free seat: a computer's first, else an away
    person's.
  - Claiming refuses when the account is already in another room.
  - The new actions are `kick` (host) and `leave`.
  - A room with no account left is removed.
  - The computers do not play while nobody is online.
- **Referral (SKATGO-117):** an account made within the hour that claims a non-host seat is recorded as brought
  by the room's host. It is checked by the account's seat in that room, no seat token.
- **Pages:**
  - The friends page shows its cards.
  - The table page joins by number, asking a signed-out visitor to sign in first.
  - The table shows the number at the top left. It copies the link and says "Link copied".
  - The menu at the top right gains "Leave room" and, for the host, "Remove <name>".

## Ruled out
- **A per-browser seat token beside the account.** One identity is simpler, and coming back from another
  device needs the account anyway.
- **Kicking from the seat plates.** The menu that already holds "leave" is where table actions are; the plates
  stay drawings.
- **Keeping schema-2 tables running alongside.** Two models for 24 hours is not worth the code. They are ended
  at deploy, after a backup.
