# SKATGO-117 acceptance checks

Local only: web on 55117 (built server), multiplayer on 56117, local PostgreSQL on 57117, as
`operations.md` Tools says. Browser checks are headed Playwright at 1280×820 and 375×812, scripts
under `tmp/`. No game is played through; a check opens a deal and makes at most a move or two.

Signed-in steps use the local test-account seam (grill Q9, Q13): `SKATGO_TEST_ACCOUNTS=1` in the
worktree's `app/.env`, and the cookie `skatgo_test_account` set in the browser context or the request.
Clerk's own sign-in window is not exercised.

## AC1 — a guest cannot open a table; signed in, one can

- Browser, guest: `/en/with-friends` shows the sign-in invitation (`data-testid=table-open-sign-in`)
  and no name form. Pass: invitation present, `table-open` absent, at both viewports.
- HTTP, guest: `POST /api/room/ticket {"for":"open"}` → `401 {"error":"sign_in_required"}`;
  `{"for":"join"}` → `200` with a ticket. Pass: exactly those statuses.
- Multiplayer, headless SDK: `create('skat', …)` with a `join` ticket → refused `admission_denied`;
  with an `open` ticket carrying a user → created, snapshot `host` equals that user (DB query).
  Pass: refusal and the stored host.
- Handler test with the session lookup stubbed: a signed-in request for `open` gets a ticket whose
  claims are `p: 'open'` and `u` = that user. Pass: test green.
- Browser, test account `test_host`: `/en/with-friends` shows the name form; opening a table lands on its
  lobby; the room's stored `host` is `test_host` (DB query). Pass: all three.
- Seam guard (unit test): with the flag unset, or the request to a non-loopback host, the cookie is
  ignored (`signedInUser` → null). Pass: test green.

## AC2 — a guest joins by name; signing up on the table records the host as referrer

- Browser, two contexts: the host (`test_host`) opens a table on the page; the invite link opened in a
  guest context with no account; the guest types a name and sits down; the host starts. Pass: the
  guest's lobby shows both people, then the table (`table-room`) appears for both.
- The guest "signs up" on the table: the script sets `skatgo_test_account=test_guest.<now>` in the guest
  context and the page reads the account again. Pass: `account_referrals` has `test_guest` with referrer
  `test_host` (DB query); the prompt shows for the guest after a deal ends only while it is a guest.
- Referral, server path: multiplayer `POST /rooms/referral` with the guest's seat token and a new user
  id → `account_referrals` has that account with the host's user id (DB query); a second call with
  another table does not change it; the host's own seat token is refused. Web handler test with the
  session stubbed: an account older than an hour is not forwarded. Pass: rows and refusals as stated.
- An account made more than an hour ago (`test_old.<now-2h>`) seated as a guest and then signed in is
  not recorded. Pass: no row for `test_old`.

## AC3 — drops, reloads and restarts bring players back

Three people at a table (host by SDK or page, two guest pages), dealt.

- Network drop: one guest page goes offline (`context.setOffline(true)`) for ~20 s, then online. Pass:
  while offline the page shows the reconnecting pill; after, the same seat (`data-seat`) is back, its
  control `human`, and one legal move is accepted (revision advances); no `table-notice` alert.
- Reload at a full table: a guest reloads. Pass: within 30 s it shows `table-room` with its seat; no alert.
- Restart: stop the multiplayer process (SIGTERM) and start it again. Pass: every page returns to its
  seat without a reload and without an alert, and a move is accepted afterwards.
- A move made while another seat drops is accepted (not `stale_revision`): unit test on the command
  check plus the SDK sequence drop → move. Pass: accepted.

## AC4 — one `room_started` per deal start; real reasons on refusal

- Browser: tap Start several times while the start is in flight. Pass: exactly one `skatgo:track`
  `room_started` event (the product's own window event); the button is disabled while sending.
- Refusals: open the table in a second tab of the same browser while the first is connected → the
  second shows the "seat open elsewhere" text, not "unreachable"; a fourth person on a started table →
  "table full / already started". Pass: the shown `table-notice` text is the specific one in both cases.

## Mechanical defence

`engineering.md` Tools, once before the handoff, plus `npm --prefix multiplayer run check`.
