# SKATGO-35 plan

## What the code already says that the ticket does not

- **The web service has no database and no secret beyond the assistant's and Clerk's.** Its only
  server route is `POST /api/ask`, answered in `app/src/server.ts` before the page router. The
  Clerk session lookup it uses (`signedInUser` in `lib/ask/handler.ts`) is private to that handler.
- **`multiplayer/` already has everything a server-owned game needs**: a PostgreSQL store with
  migrations in `Store.migrate()`, one fenced leader process, a crypto-shuffled deck
  (`secureDeck()`), the engine adapter (`applyAction`, `computerMove`) and a seat-redaction pattern
  (`publicView` / `privateView`). It runs in production as `skatgo-multiplayer` with its own
  Render PostgreSQL `skatgo-multiplayer-db` (both exist and are `available`, checked 2026-10-01). Its
  Express app currently serves only `/healthz` and `/readyz`.
- **No browser can reach multiplayer today** ("no frontend admission flow is shipped yet",
  operations.md). The web service carries no `MULTIPLAYER_URL` or admission key.
- **The computer players are deterministic** — `ai.ts`, `game.ts`, `value.ts` use no randomness. A
  deal is therefore fully reproduced by *its deck + dealer + the human's actions*; replaying that log
  through the engine is the score.
- **`GameTable` is built on a whole local `Game`** (all three hands) and drives the computers with
  its own timers. The hints (`hints.ts`) and the assistant snapshot (`table-view.ts`) read only seat
  0, the trick history and — when the learner is declarer and picked it up — the skat.
- **The site speaks `en` and `de` only** (`project.inlang/settings.json`); `/daily` is `/en/daily` and
  `/de/taeglich`. `product.md` still says three languages incl. Chinese — charter drift, reported,
  not fixed here.
- **`ui.md` names registries that no longer exist** (`skat.stylex.ts`, `effects.stylex.ts` roles…);
  the code has `color.stylex.ts`, `shape.stylex.ts`, `elevation.stylex.ts`, `table.stylex.ts`. The
  mechanical token check is what binds; drift reported, not fixed here.

## Route

The tournament is **server-owned in `multiplayer/`**, reached by the browser **only through the web
service** as a thin same-origin proxy. Plain HTTP request/response, not a Colyseus room: one human
and two deterministic computers need no socket, and each move's answer can carry the computers'
replies.

```
browser ──/api/daily/*──▶ web (identity: Clerk session or anon cookie)
                           └─ server-to-server, admission key ─▶ multiplayer /daily/* ─▶ PostgreSQL
```

### Slice 1 — multiplayer: the tournament model (`multiplayer/src/daily.ts`)

- **Day**: `YYYY-MM-DD` in `Europe/Berlin` from the server clock.
- **Deals**: on the first request of a day, 12 decks from `secureDeck()`; deal 1's dealer is
  crypto-random and the dealer then rotates clockwise (grill Q4), inserted once (`INSERT … ON CONFLICT DO NOTHING`, then read). Same for every
  player; the player is always seat 0. No secret key needed — the deals are stored, not derived.
- **Entry** per `(day, player)`: for each deal, the list of the human's actions; plus finished deal
  scores. State is never stored — it is `replay(deal, actions)`: `deal(dealer, deck)` then the
  human's actions, running `computerMove` whenever it is a computer's turn or a trick ends.
- **Seeger-Fabian** per deal from the replayed result: player declared → won `value + 50`, lost
  `−2·value − 50`; player defended → `+40` if the declarer lost, else `0`; passed in → `0`.
- **View for seat 0** (the only thing that leaves the server): own hand; bidding, declarer, bid,
  declaration, trick, finished tricks, result; opponents' **card counts only**; the skat only when
  seat 0 is declarer and picked it up, or once the deal is done (the settlement shows it, as at a real
  table); an Ouvert declarer's hand as `publicView` already does. Never another deal's cards.
- **Act**: validate with the existing `actionSchema` + `applyAction`-style rules, check `revision`
  (number of human actions so far in this deal) so a double submit cannot apply twice, append,
  replay, and return the **steps**: the view after the human's move and after every computer move or
  trick collection up to the human's next turn or the deal's end. On deal end, write its score from
  the replay. Scores are never read from the request.
- **Once a day**: a player with a finished entry gets the summary, never a deal. Unfinished: the first
  unfinished deal, replayed to where they left it.

### Slice 2 — multiplayer: storage and HTTP

- `Store.migrate()` gains `daily_deals(day PK, deals jsonb)` and
  `daily_entries(day, player, deals jsonb, scores jsonb, total int, finished_at bigint, PK(day, player))`.
- Express routes `POST /daily/state`, `POST /daily/act`, `POST /daily/claim` (anon → account), each
  requiring the admission key in a header (timing-safe, as rooms do) and `ready()`.
- `player` is opaque to multiplayer: `user:<clerkUserId>` or `anon:<sha256 of the cookie>`.

### Slice 3 — web: the proxy (`app/src/lib/daily/` server side)

- `app/src/server.ts` answers `/api/daily/state` and `/api/daily/act` before the page router, like
  `/api/ask`.
- Identity: Clerk session (the existing lookup moved to a shared server module and reused by
  `/api/ask`); otherwise an httpOnly, `SameSite=Lax`, `Secure`, 400-day `skatgo_daily` cookie with 32
  random bytes, set on first use. Signed in with an anon cookie that has today's entry → `claim` first
  (current day only, grill Q7; the account's own entry wins when both exist).
- Forwards to `MULTIPLAYER_URL` with `MULTIPLAYER_ADMISSION_KEY`; passes the JSON through.

### Slice 4 — web: the page and the table

- `GameTable` gains a **source**: the existing local one (free play, lessons — unchanged), or a
  remote one that holds a server view, sends moves, and plays the returned steps one by one on the
  table's existing `BOT_DELAY` / `TRICK_DELAY` beats. The remote view becomes a `Game` for the
  renderer with opponents' hands as face-down placeholders.
- `daily-page.tsx`: the server-rendered intro stays; its button becomes start / continue (deal n of
  12) / done. Playing opens the full-screen table in the page (browser-only, through
  `client-part.tsx`), like `/play`. After each deal the settlement adds the deal's Seeger-Fabian score
  and "next deal"; after 12, a summary of the 12 scores and the total.
- Tournament table (grill Q3/Q8): no hint tab and no hint buttons in drawer or panel; the table is
  not published to the assistant; the panel's leave link returns to `/daily`. SKATGO-34's stage
  layout and pinned panel stay as they are.
- New strings in `messages/en.json` and `de.json`.

### Slice 5 — charter (human-authorized on the ticket)

- `product.md`: the daily tournament in the product's contract; the "only the course" line replaced.
- `engineering.md`: where the tournament runs (multiplayer), where its data lives (its PostgreSQL),
  the web proxy, the redaction rule.
- `operations.md` (grill Q9): the tournament's lines only — the web's env list, the runtime paragraph,
  the local run of web + multiplayer, and the deploy order (multiplayer before web).

## Grill outcome

Settled 2026-10-01 (`grill.md`): Q1 production schema + web env approved by the human (deploy time
only); Q2–Q10 as recommended with the amendments folded in above.

## Redline lookup (before any code)

| Action the route needs | Entry | Result |
|---|---|---|
| New tables in production `skatgo-multiplayer-db` (applied by `migrate()` on deploy) | operations.md R5 "changing production schema" | **approval required** → grill Q1 |
| Web service gains `MULTIPLAYER_URL` + `MULTIPLAYER_ADMISSION_KEY` in production | operations.md R5 "an env key or secret it does not already have" | **approval required** → grill Q1 |
| New dependency | engineering.md R3 | none needed (built-in `fetch`, `node:crypto`, existing `pg`/`zod`/`express`) |
| New cloud resource | operations.md R3 / ticket constraint | none needed — service and DB exist |
| Editing `product.md` | product.md R2 "forbidden outright" | the human authorized this edit on the ticket (2026-10-01) → wording confirmed in grill Q7 |
| Route file importing a page not through `client-page` | engineering.md R4 | `/daily` keeps `ClientPage page="daily"` |
| New design token | ui.md R1 | aim: none; a needed one is a stop and a question |
| Production data from acceptance | operations.md R2 | acceptance runs only against local multiplayer + local Docker PostgreSQL |

Nothing on the route is forbidden outright. Production env and schema need the human's yes.

## Departures found while building

- **The table has its own page, `/daily/play`** (`/de/taeglich/spielen`), instead of opening inside
  `/daily`: the frame is chosen by the path (`skat-layout.tsx`), and only a table path gets the
  full-screen frame `/play` has. A reload therefore lands back on the table. The route file is
  `daily_.play.tsx` (not nested under `/daily`, which has no outlet); it is in the sitemap like
  `/play`.
- **The assistant is simply not on that page** — `ask.tsx` mounts only on the pages it names — so
  the tournament table reaches it neither by snapshot nor by launcher.
- **`DAILY_DEALS` / `DAILY_TIME_ZONE` moved into `lib/skat/tournament.ts`** (re-exported by
  `lib/daily.ts`): the multiplayer image copies only `app/src/lib/skat/`.
