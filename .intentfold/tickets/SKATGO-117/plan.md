# SKATGO-117 plan

## What the code already promises, and what the ticket does not say

- **Admission today.** `/api/room/ticket` (`app/src/lib/room-handler.ts`) hands any visitor a two-minute
  ticket (`lib/room-ticket.ts`, `{v:1, exp}`); the room (`multiplayer/src/room.ts`) lets any valid ticket
  create a table or take a seat. Nothing knows who the host is. The ticket must start to say what it is for
  (open or join) and, for opening, whose account opened it — and the room must refuse to open a table
  without it. Integration clients with the admission key keep creating tables as now (tests, SDK checks).
- **Guest identity.** A guest's only link to a table is the seat token in `localStorage`
  (`skatgo-table/<roomId>`), kept so the same link brings them back (strictly necessary). The daily
  tournament's device cookie is scoped to `/api/daily` and never reaches the rooms. There is no place
  where a later sign-up could be tied to a table without reading that stored token again (grill Q1).
- **Deploys.** `/healthz` is liveness only; the new process becomes ready only after the old one drops
  the advisory lock (`multiplayer/README.md`, "During a Render rolling deploy…"). Pointing Render's health
  check at `/readyz`, as the Proposed solution suggests, would deadlock every deploy: the new instance
  never becomes ready while the old one runs, and Render stops the old one only when the new one is
  healthy. Instead the web asks `/readyz` before issuing a ticket and answers `503 not_ready`, and the
  browser keeps retrying (grill Q7).
- **Why a dropped seat cannot get back in.** `maxClients = 3` counts a dropped client's reconnection
  reservation, so a full table auto-locks and `joinById` is refused with "locked". Seats are already
  enforced by `onJoin` (invite, lobby only, an empty seat), so the client limit can be raised to leave
  room for reservations without changing who may sit down.
- **Why moves bounce.** `store.change` bumps `revision` for every write, presence included; `command`
  insists on `cmd.revision === s.revision`. A move made while someone else drops or reconnects is
  refused as stale and the card silently returns. Commands should be stale only when the game itself
  changed since.
- **Why the table freezes.** `sending` is cleared only by a receipt; a receipt that never comes (the
  socket died) leaves every later action dropped. There is no `onDrop`/`onReconnect` handling, and after
  `onLeave` the page tries to come back once.
- **`room_started` is tracked on the tap**, before `send`, so taps that send nothing are counted.
- **Rejections are mislabelled** by `reason()` in `room-client.ts`: anything not in its list is
  "unreachable".
- **Settled in the grill** (all 13, `grill.md`): referral only for sign-ups made on the table page, new
  accounts only, in `account_referrals`; honest prompt words; a privacy line; the Tricks-style sign-in
  invitation; `/healthz` kept with a readiness-gated ticket; web released before multiplayer; signed-in
  checks through a local test-account seam (Q13); the charter lines.

## Route

### 1. Admission: open needs an account (web + multiplayer)

- `room-ticket.ts`: a ticket stays `v:1` and carries `p: 'open' | 'join'` and, for `open`, `u` (the Clerk
  user id). `ticketValid` becomes `ticketClaims` (claims or null); the old boolean callers move to it.
- `room-handler.ts`: `POST /api/room/ticket` reads `{ for: 'open' | 'join' }`. `open` without a Clerk
  session (`signedInUser`) → `401 sign_in_required`. Before issuing, `GET <MULTIPLAYER_URL>/readyz`;
  not ready → `503 not_ready`.
- `room.ts` `onCreate`: a browser ticket must be `p: 'open'` with `u`; the snapshot records `host: u`
  (an optional field; schema stays 2, older snapshots read as no host). Admission-key creation unchanged.

### 2. The friends page: sign in to open (UI)

- `OpenTable` (table-room.tsx) uses `useAccount()`: while loading, nothing; a guest sees the invitation
  in the Tricks gate's form (SKATGO-112: a line and a `go` button wrapping Clerk's `SignInButton`
  `mode="modal"`, no lock); signed in, the name form as now. `openTable` asks for an `open` ticket and
  maps `sign_in_required`.

### 3. Referral (per Q1–Q3)

- Recommended route: when a guest seated at a table signs up there, the page posts
  `POST /api/room/referral { roomId, seatToken }` with the new session. The web checks the account is
  new (Clerk `createdAt` within an hour) and forwards to multiplayer `POST /rooms/referral` (admission
  key) with the user; multiplayer checks the seat token is a non-host seat of that room, the room has a
  host and the host is someone else, and inserts into a new table
  `account_referrals (account PRIMARY KEY, referrer, room_id, created_at)` — first one wins.
- The prompt after a deal (`standings` in `Playing`) for a guest: one line and a `quiet` sign-in button,
  dismissable for this table (Q4).

### 4. Stability (small fixes)

- **Client** (`table-room.tsx`, `room-client.ts`):
  - clear `sending` on attach, drop and leave;
  - `onDrop` → a "reconnecting" pill over the table; `onReconnect` → it goes;
  - after `onLeave`, `comeBack` retries transient failures with backoff (Q12), at once on
    `visibilitychange` (visible) and `online`;
  - `reason()` keeps the real cause: `seat_taken`, `not_ready`, `sign_in_required`, plus the existing
    ones; transient ones retry instead of ending in an error;
  - `room_started` is tracked from the start's ok receipt; the Start button is disabled while sending;
  - the SDK's short reconnection is kept; the durable seat token remains the way back after it.
- **Server** (`room.ts`, `model.ts`, `store.ts`):
  - `maxClients` 3 → 6, so reservations never lock a table (seats stay governed by `onJoin`);
  - a command is stale only if the game changed after its revision: `played` (revision of the last
    game-changing write) set in `command` and in `advance`'s computer moves; the check becomes
    `played ≤ cmd.revision ≤ revision` (missing `played` → strict equality);
  - `expire()` failures are caught and retried; the computer-failure retry logs its real reason and backs
    off to 30 s (Q10).

### 5. Local test accounts (Q13)

- `app/src/lib/test-account.ts` (server only): `testAccount(request)` returns `test_<name>` and its
  creation time only when `process.env.SKATGO_TEST_ACCOUNTS === '1'` **and** the request's own host is
  `localhost` / `127.0.0.1`, from the cookie `skatgo_test_account=<name>.<createdAtMs>`; otherwise null.
- `session.ts` `signedInUser` asks it first; a new `accountCreatedAt(request, userId)` reads the test
  account's time or Clerk's `createdAt`.
- The root loader hands the test account to the page; `useAccount()` prefers it. No other module knows.
- A unit test: flag off, or a non-loopback host, ignores the cookie.

### 6. Charter (Q12)

product.md one line on private tables; engineering.md the ticket claims, `account_referrals` and the
test-account seam; operations.md the stale "no frontend admission" sentence, the release order and the
signed-in acceptance via local test accounts. Privacy page line (Q5) in `app/messages`.

## Slices, in order

1. ticket claims + handler + room `onCreate` (+ multiplayer tests for create refusal);
2. friends page sign-in surface;
3. client stability (sending, drop/reconnect UI, retry, reasons, start tracking);
4. server stability (`maxClients`, `played`, expire, retry);
5. local test accounts (Q13);
6. referral (multiplayer route + table, web route, prompt);
7. charter lines, messages en/de, privacy line.

## Release

Web first, then multiplayer (Q8): the web's new tickets are still `v:1` with extra fields, which the
running multiplayer accepts; the new multiplayer then requires `open` for creating.
