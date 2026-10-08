# SKATGO-61 handoff

## What changed

**Multiplayer service** (`multiplayer/`)

The SKATGO-20 Colyseus room is now the site's private table.

- **Admission** (`src/room.ts`):
  - a browser comes in with a two-minute ticket the web server signs with the admission key (`app/src/lib/room-ticket.ts`), in place of the key itself;
  - trusted clients (the tests) still use the key;
  - a new seat needs a nickname, judged by the leaderboard's rules (`nickname.ts`).
- **Model** (`src/model.ts`, snapshot `schema: 2`):
  - seats fill in arrival order in a lobby;
  - seat 0 (the host) sends `start`: whoever sits there plays, the empty seats are computers for good, and nobody joins after;
  - after a deal, anyone seated sends `next`; the dealer moves on;
  - each deal's Seeger-Fabian scores add to the running `scores`;
  - the public view adds nicknames, the deal count, the scores and `turn`; the skat is shown once a deal is over;
  - `publicView` / `privateView` are typed against `app/src/lib/skat/room-view.ts`.
- **Computers**: SkatZero, as in free play.
  - Each deal is drawn from free play's pool with the dealer the table needs, with every seat's prepared bidding plan.
  - The discard and game after a pick-up, and every card, come from the models live (`computerTurn`, shared with free play).
  - A computer standing in for a person who dropped also finishes a half-done skat step.
  - SKATGO-59's claim and concession apply (`decided`, now told which seats are computers).
- **Pool** (`skatzero/free-pool.json.gz`, `scripts/make-free-pool.ts --extend`): every deal also has seat 0's plan, worked out once (4.8 min, 12 processes).
  - The 1,000 deals, seats 1 and 2's plans and the version label `skatzero@1fe5cab` are unchanged (verified deal by deal), so free play and its games in progress are untouched.
  - The manifest is updated.
- `store.all()` restores only `schema: 2` tables; older ones expire.
- **README**: the Protocol section is rewritten for this.
- **Tests** (`test/rooms.test.ts`): updated to the new protocol, and new cases added:
  - ticket admission; forged or expired tickets refused; no nickname refused;
  - no joining after the start;
  - deal after deal with the dealer moving on and the totals running;
  - the skat shown after the deal.

**Web** (`app/`)

- New dependency `@colyseus/sdk` 0.18.4, exact. The human approved it on 2026-10-08 (grill Q1, Redline 3; recorded on the ticket).
- `POST /api/room/ticket` (`src/lib/room-handler.ts`, wired in `src/server.ts`) returns the multiplayer address and a ticket, at most 120 an hour per address.
- `src/lib/room-client.ts`:
  - opens a table or sits down;
  - keeps each table's seat token (and the host's invite code) in localStorage under `skatgo-table/<id>`;
  - reads the room's state and sends commands with their revision.
  - The invite code travels after `#` in the link.
- `src/lib/skat/room-view.ts`: the room's views, and `roomGame`, which turns the table so the viewer is seat 0.
- **Pages**:
  - `/with-friends` (`/de/mit-freunden`, `/en/with-friends`): public and indexable, rendered on the server, with the nickname field and "Privaten Tisch eröffnen" / "Open a private table" (`friends-page.tsx`, `table-room.tsx`).
  - `/table/$id` (`/de/tisch/…`, `/en/table/…`): noindex, wears the table frame (no header).
    - In the lobby: the seats, the invite link with a copy button, and the host's "Spiel starten", with a way out.
    - Then the table; a lost connection rejoins with the seat token.
- **`GameTable`**:
  - seat names come from a context: a private table's nicknames, computers marked "(KI)" / "(AI)";
  - new `room` source: no hints, no assistant; standings under the result; "Nächstes Spiel"; the leave link goes to the friends page;
  - a private table's early-end lines are neutral (a nickname's gender is unknown).
- **Kit**: `TextField` in `ui.tsx`, now also used by the daily nickname.
- **Entry links**: free play's reading section, the last lesson's "ways on", and the friends page links on to the rules, course and free play.
- **SEO**:
  - `PRIVATE_PAGES` accepts a route with a parameter;
  - the inventory treats `/table/$id` as personal and checks it at a sample address;
  - the sitemap lists `/with-friends`.
- **Events**: `room_created`, `room_joined`, `room_started` with the number of people.
- **`vite.config.ts`**: rewrites, at build time, the reviewed and guarded `Buffer` uses in `@colyseus/schema` and msgpackr into the `globalThis.Buffer` form the client-bundle check accepts (see Deviations).

## AC results

Local web 55061, multiplayer 56061, database 57061. Headed Playwright (`tmp/ac61.mjs`, driver `tmp/drive.mjs`): the host at desktop 1280×820 and the friend at phone 375×812, then the sizes swapped. Deals were driven by scripted legal moves. Both runs passed, on the final build with the rewrite, and once before it.

1. **Open, invite, join by nickname only, one shared game.** Met.
   - The host opens `/de/mit-freunden` and gets `/de/tisch/<id>#<64 hex>`.
   - The friend's fresh context is signed out (no Clerk `__session`, `__client_uat` 0), opens the link, enters only "Bert", and sits down.
   - Both lobbies list Anna and Bert. After the start, both tables show the same revision, dealer, deal and phase.
   - Each sees ten cards of their own; neither page's DOM holds the other's cards.
2. **Two people plus a computer complete a deal.** Met.
   - The seats are person, person, computer; the computer's plate reads "Max (KI)".
   - The deal ran to its result in both contexts, with the same Seeger-Fabian scores (e.g. −242 / +40 / +40).
3. **Two deals; running totals match.** Met.
   - "Nächstes Spiel" dealt deal 2, with the dealer moving 2 → 0.
   - Totals are deal 1 + deal 2 for every seat, the same from both seats and in the info board (e.g. −676 / +80 / +80).
4. **Closing the page hands the seat to the computer; the link brings it back.** Met.
   - The friend's page closed mid-deal. After 30 s the seat was computer-controlled, the plate read "Bert (KI)", and the deal moved on without them.
   - Reopening the link in the same browser put them back in the same seat with their hand, without asking for a name; the host saw a person again; the deal finished with them.

No page errors in any run. Also checked:
- `rooms.test.ts` (ticket refusals, no joining after the start);
- `room-view.test.ts` (seat turning, Seeger-Fabian turned, ticket expiry and tampering);
- `check:seo`: the private table is noindex and not in the sitemap.

**Mechanical defence**: passed in full — typecheck, build, 101 tests, bundle (23 chunks), tokens, literal grep, SSR link, `check:seo -- --built` (44 indexable, 4 noindex, 4 linked files), `test:seo` 25/25. `npm --prefix multiplayer run check`: typecheck, build, 21/21 tests.

## Deviations

- **Client-bundle check.** `@colyseus/sdk` brings `@colyseus/schema` and msgpackr, whose guarded `typeof Buffer` tests the check rejects (it accepts the `globalThis.Buffer` form). The check was not loosened (Redline 7). The human chose the build-time rewrite (2026-10-08). Every `Buffer` use in the bundled files was reviewed:
  - only the guarded ones are rewritten;
  - their number is pinned per file, so a library update fails the build until reviewed again;
  - msgpackr's Node-only stream helpers (unguarded `Buffer.concat`, not in the bundle) are left for the check to catch.
- The plan named `/room`; the grill renamed it to `/with-friends` and `/table/$id`.
- **Hints and the assistant are off at a private table**, as in the tournament: the others at the table get none either.
- **A stand-in computer naming a Hand game.** It finds a person who chose Hand and dropped before naming the game; when the seat's plan would have picked up, it names the game the course's advice gives (`declarationAdvice`). The pool stores only the best choice per bid, not every Hand game's value. This is a narrow case: the person dropped mid-step and the 30-second grace passed.
- **SKATGO-59's early-end lines.** For named seats a neutral sentence replaces the Lina/Max wording ("{name} zeigt den Rest und bekommt die letzten {n} Stiche.", "Gegen den Null von {name} …", "Deinen Null kann niemand mehr knacken …").

## Environment

- Ports 55061 / 56061 / 57061. Web and multiplayer are left running for review; the local database container `skatgo-multiplayer-db-57061` is running.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` port were pointed at the ticket ports for local acceptance only.
- **No env key added, changed or removed.** The ticket endpoint uses the existing `MULTIPLAYER_URL` and `MULTIPLAYER_ADMISSION_KEY`.
- In production the browser connects to `MULTIPLAYER_URL` (the multiplayer service's public Render address) directly. Colyseus answers its matchmaking with the request's origin.

## Residual

- **Deploy order**: multiplayer before web, as operations.md says.
- **Production database**: rooms stored under schema 1 are not restored. The production database could not be read from here (IP allow list), and with no front end until now there should be none.
- **Charter drift**, not edited:
  - `product.md`'s "What this product is" has no private tables;
  - `engineering.md`:
    - the rooms' paragraph still says integration clients only;
    - routes and paths lack `/with-friends`, `/table/$id`, `room-client.ts`, `room-handler.ts`, `room-ticket.ts`, `room-view.ts`, `friends-page.tsx`, `table-room.tsx`;
    - "Rooms and hints keep the heuristics" is no longer true for rooms;
    - the build rewrite in `vite.config.ts` is undocumented;
  - `ui.md`:
    - the kit lacks `TextField`;
    - the tables in "Frames and pages" lack the private table and its lobby;
  - `operations.md`: the runtime doesn't mention browser connections to the multiplayer service or `/api/room/ticket`.
- **CPU**: SkatZero card play is live per computer move at every open table (milliseconds each); the room store caps open tables at 128. Worth watching once real use starts (grill Q9 events).
