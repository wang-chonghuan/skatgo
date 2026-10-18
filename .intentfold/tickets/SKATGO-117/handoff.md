# SKATGO-117 Handoff

Delivered for review (`finish: review`). No merge, deployment or production data change.

## What Changed

**Opening a table needs an account; joining does not** (web + multiplayer)

- `app/src/lib/room-ticket.ts`: a ticket stays `v:1` and now says what it is for — `open` with the
  opening account (`user:<id>`), or `join`. `ticketClaims` replaces `ticketValid`; a ticket naming no
  purpose is a `join` one.
- `app/src/lib/room-handler.ts`: `POST /api/room/ticket` takes `{ for: 'open' | 'join' }`; `open` without
  a session → `401 sign_in_required`. Every ticket waits for the multiplayer service's `/readyz`
  (`503 not_ready` otherwise). New `POST /api/room/referral`.
- `multiplayer/src/room.ts`: a browser creates a table only with an `open` ticket; the snapshot keeps
  its `host`. Integration clients with the admission key are unchanged.

**The friends page and the table** (`app/src/components/skat/table-room.tsx`, `game-table.tsx`, messages)

- A guest on `/with-friends` sees "Opening a table takes a free account…" and a `go` button opening
  Clerk's sign-in window, in place of the name form (the Tricks gate's form, no lock). "How it works"
  step 1 now says to sign in.
- After a deal, a guest at someone else's table sees one line, a `quiet` Sign up (Clerk's sign-up
  window) and No thanks; No thanks is remembered for that table.
- A guest who signs up while seated: the page posts the seat to `/api/room/referral`; the web passes it
  on only for an account made within the hour; multiplayer writes `account_referrals`, first table only.
- Privacy page (`lib/legal.ts`, both languages, updated date 2026-10-19): one sentence on it.

**Stability**

- Client: the "sending" lock is cleared on (re)connect and on leaving, so a table no longer freezes
  after a drop. While the connection comes back, the table stays on screen with a "Reconnecting …"
  pill where the table's messages go, and takes no moves. After the SDK gives up, the seat token tries
  again with back-off (1, 2, 4, 8 s, then every 10 s) for two minutes — at once when the page comes back
  to the front or the network returns — then shows the reason with "Try again". A seat still open
  elsewhere is waited for 20 s. Refusals keep their real reason (`seat_taken`, `room_full`,
  `not_ready`, `sign_in_required`, …). `room_started` is tracked from the start's accepted receipt;
  Start is disabled while sending.
- Server: `maxClients` 3 → 6, so a reconnection reservation no longer locks a full table against its
  own players. A move is stale only if the game changed after its revision (snapshot `played`), not
  when someone drops or returns. A failed expiry retries after 30 s instead of an unhandled rejection; a
  failing table turn logs its real reason and backs off to 30 s.

**Local test accounts** (`app/src/lib/test-account.ts`, `session.ts`, `use-account.ts`, `__root.tsx`)

- The cookie `skatgo_test_account=<name>.<created ms>` signs a request in as `test_<name>` only with
  `SKATGO_TEST_ACCOUNTS=1` in the server's environment **and** a request to `localhost`/`127.0.0.1`. The
  root route hands it to the page. Unit-tested both guards (`room-handler.test.ts`); the built client
  chunks contain neither the variable nor the cookie name.

**Charter and docs** (authorized in grill Q12): product.md (private tables paragraph), engineering.md
(accounts line, structure rows, two Key decisions), operations.md (runtime sentence, signed-in
acceptance via local test accounts, local-only env key, web-first release for this ticket, and the
stale "Google is switched off" corrected to observed state), `multiplayer/README.md`.

## AC Results

Local: web built server on 55117, multiplayer on 56117 with its own database (`skatgo_117` in the local
container on 3222), headed Chromium 1280×820 and 375×812 (phone with `isMobile`, `hasTouch`). Scripts
and screenshots in `tmp/` (`ac.mjs`, `ac-restart.mjs`, `ac-reconnect.mjs`, `ac-referral.mjs`, `*.png`,
`*-results.json`). Final run on the delivered commit `17ac5f2`.

1. **PASS.** Guest at both sizes: sign-in invitation shown, no name form. `POST /api/room/ticket`
   `{"for":"open"}` as guest → `401 sign_in_required`; `{"for":"join"}` → 200. Test account `test_host`
   opened a table from the page; `multiplayer_rooms.snapshot.host` = `user:test_host`. SDK: a `join`
   ticket cannot create (`admission_denied`); an `open` ticket stores the host (`rooms.test.ts`). Handler
   tests: the signed-in `open` ticket's claims name the account; a test account on `skatgo.com` → 401.
2. **PASS.** Two guests joined by name (phone and desktop); host saw three people; table appeared on all
   three. After an all-pass deal the guests saw the sign-up line, the host did not. A fresh account
   signing up at the table → `account_referrals` row with referrer `user:test_host` and that room; the
   line was gone once signed in; an account made two hours earlier → no row. Server path
   (`rooms.test.ts`): recorded once, host seat / unknown seat refused (`not_a_guest`), integration table
   refused (`no_host`), no key 403. (The first full run's referral line failed only because the shared
   ticket database already held that account from an earlier run — first table wins, as specified; it
   passed with a fresh account.)
3. **PASS.** Offline ~20 s (desktop) and briefly (phone): the table stayed under "Reconnecting …", then
   the same seat came back under its person's control, no alert, and "Next deal" was accepted. A guest's
   reload at a full table returned to its seat. SIGTERM and restart of multiplayer mid-auction: all three
   pages returned to seats 0, 1, 2 without reload or alert, and a pass was accepted. SDK: a dropped
   person rejoins a full table with the seat token while the reservation stands; a move made while
   another seat dropped is accepted. Both SDK checks fail with the old `maxClients`/revision rule
   (verified by reverting, then restored).
4. **PASS.** Five taps on Start → one `room_started` (`skatgo:track`). Same seat in a second tab → "Your
   seat is already open in another tab or on another device."; a fourth person after the start → "This
   table is already playing."

**Mechanical defence** (engineering.md Tools, once): PASS — typecheck, build, 278 tests in 17 files,
client bundle (75 chunks), design tokens (163 files), literal grep 0, SSR link, `check:seo --built`
(48 indexable, 46 noindex), `test:seo`. `npm --prefix multiplayer run check`: PASS, 26 tests.

## Deviations

- **Health check stays `/healthz`** (Proposed solution said `/readyz`): the new process becomes ready only
  after the old one releases the rooms, so a readiness health check would deadlock every deploy. The web
  gates tickets on `/readyz` instead and the page retries (grill Q7).
- **Referral only for sign-ups on the table page** (grill Q1): later sign-ups elsewhere would need reading
  browser storage for attribution, i.e. a consent banner. The ticket's Scope and AC 2 were amended and
  commented.
- **Local test-account seam** added at the human's request (grill Q9/Q13) so signed-in checks run
  without Clerk.
- **Computer failure**: back-off and real reason only; no new error UI (grill Q10).
- Small additions found while checking: "How it works" step 1 mentions signing in; a seat open
  elsewhere is told after 20 s rather than after the two-minute retry.

## Environment

- Ports: web 55117, multiplayer 56117; database: the local container on 3222, database `skatgo_117`
  (the 57117 block was not needed).
- Env keys: **added `SKATGO_TEST_ACCOUNTS=1` to the local `app/.env` only** (sync to the main checkout at
  close). No production env change; production must never carry it.
- Schema: new table `account_referrals` (created by `store.migrate`); snapshot gains optional `host` and
  `played` (schema stays 2; older snapshots read as no host / strict revision).
- **Release order: web first, then multiplayer** (operations.md updated).

## Residual

- Match Point scoring for North American tables was left out on purpose (SKATGO-114 discussion).
- A table whose computer keeps failing still only waits (with back-off); an error state for the table
  would be its own ticket if it is ever seen.
