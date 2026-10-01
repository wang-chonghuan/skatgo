# SKATGO-35 handoff

## What changed

**Tournament server — `multiplayer/`**
- `src/daily.ts` (new): the daily tournament. Each Berlin day gets 12 crypto-shuffled decks. Deal 1's
  dealer is random, then the dealer rotates clockwise. Everything is stored once in `daily_deals`. Each
  player's entry (`daily_entries`) holds the human's moves per deal, the per-deal summaries
  (declarer, declaration, bid, won, Seeger-Fabian per seat) and the total. The current deal is
  replayed from deck + moves through the engine, and the score is what that replay settles.
  Routes `POST /daily/state | act | claim` sit behind the admission key. They refuse a stale revision,
  another deal, a past day, a finished day, and any extra field (strict schemas).
- `src/store.ts`: `migrate()` creates the two tables. `src/server.ts`: mounts `/daily`.
- `src/model.ts`: room moves now go through the shared `applyMove` (`applySeatMove`). Behaviour is
  unchanged, and the rooms suite passes.

**Shared engine — `app/src/lib/skat/`**
- `game.ts`: `Move` and `applyMove`, used by the local table, the rooms and the tournament.
- `tournament.ts` (new): `seatView` (what seat 0 may see), `gameFromView` (face-down stand-ins for
  the table), `seegerFabian`, `summarize`/`totals`, the reply types, and the day settings
  (`DAILY_DEALS`, `DAILY_TIME_ZONE`, re-exported by `lib/daily.ts`).

**Web — `app/`**
- `lib/daily-handler.ts` (new): the `/api/daily/state | act` proxy, wired in `server.ts`. The player is
  the Clerk account, or else a device id in an httpOnly `skatgo_daily` cookie (Path `/api/daily`,
  400 days), sent on only as its hash. A signed-in `state` request with a device cookie first claims
  today's device entry. `lib/session.ts` (new) holds the Clerk lookup moved out of
  `lib/ask/handler.ts`, which now imports it.
- `lib/daily-api.ts` (new): the browser's two requests.
- `components/skat/daily-table.tsx` (new):
  - `DailyEntry` on `/daily`: start / "Continue: deal n of 12" / the day's result with 12 deals and
    the total.
  - `DailyTable`: replays the server's steps on the table's own beats.
- `components/skat/game-table.tsx`: an optional `tournament` source. With it:
  - no local computers and no hint tab or hint buttons;
  - no snapshot for the assistant;
  - a "Deal n of 12 · total" pill;
  - the settlement shows "This deal: ±X (Seeger-Fabian)", then "Next deal" / "See today's result";
  - a passed-in deal scores 0 with no redeal;
  - leave goes to `/daily`;
  - the info board's totals are the day's Seeger-Fabian.

  Free play and lessons are unchanged.
- Route `routes/daily_.play.tsx` (`/daily/play`, `/de/taeglich/spielen`) with the table frame
  (`frame.tsx` `sectionOf`). It is in the sitemap, and its localized paths are in
  `paraglide.options.ts`.
- `daily-page.tsx`: the button became `DailyEntry`; `DailyPlay` is the new page. Strings were added in
  `messages/en.json` and `de.json`.

**Charter** (authorized by the human, grill Q9):
- `product.md`: the tournament is in the contract and replaces "only the course".
- `engineering.md`: Stack, Structure, Key decisions and a hotspot.
- `operations.md`: runtime, local env, production env list and deploy order.

## AC results

Stack: built web on 55035, local multiplayer on 56035, local Docker PostgreSQL on 57035. Scripts are
in `tmp/`: `api-check.mts`, `midnight-check.mjs` + `shift-clock.mjs`, `ui-check.mjs`. No browser
played a deal (standing rule). Whole days were driven through `/api/daily/*`.

1. **Same 12 deals for everyone, new set after Berlin midnight — PASS.**
   - Players A and B, each with their own cookie, were dealt identical hands, dealers and seats for all
     12 deals (dealers `201201201201`); the player sat 4× in each role.
   - The local multiplayer was restarted with the clock shifted past Berlin midnight. New player C got
     day `2026-10-02` and a deal 1 that differs from A's. The DB held two `daily_deals` rows with
     different decks. A, who had finished the previous day, started fresh.
   - Browser: `/en/daily` and `/de/taeglich` open, and the table deals 10 cards (1280×820 and
     375×812).
2. **Per-deal and total Seeger-Fabian equal the server's record; tampering changes nothing — PASS.**
   - A's and B's `daily_entries` per-deal scores and totals equal an independent Seeger-Fabian
     computation in the script (`[0,0,0,-338,0,0,0,0,40,0,40,40]`, total −218).
   - Five forged requests mid-deal were refused (400, 400, 409, 409, 400) and the DB row was
     byte-identical afterwards: an extra `score`, an extra `total`, another deal, a stale revision, and
     a body naming a player.
   - Browser with A's cookie: the result lists 12 scores and the total, equal to the DB, at both
     viewports.
3. **Once a day; reload resumes the unfinished deal — PASS.**
   - Browser, fresh player at both viewports: start, one bid, reload. Same deal (1 of 12), same hand,
     no new deal. `/en/daily` then offers "Continue: deal 1 of 12" and `/de/taeglich/spielen`
     continues the same deal.
   - Finished players: the page shows the result with no start link; the API returns no deal and
     refuses a move with `day_finished`.
4. **Nothing hidden leaves the server before the deal is over — PASS.**
   - Every response of A's and B's 24 deals was checked mechanically. Each card named is in the
     player's dealt hand, already played, the skat once the player picked it up as declarer, an
     Ouvert declarer's hand, or the settlement's skat at `done`. The skat is `null` otherwise, and the
     card counts always total 32.
   - Browser: both opponents' hands render as 20 card backs.

Tournament table (grill Q3/Q8) — PASS at both viewports: no hint tab, no hint buttons (bid, skat,
discard, declare), leave → `/en/daily`. The assistant is not on `/daily/play`, so the table reaches it
neither by snapshot nor launcher.

Unchanged behaviour — PASS: `/en/play` deals and leaves to `/en`; the last lesson's embedded table
deals. No console errors.

Also checked:
- `/daily/claim` against the local multiplayer: it moves today's device entry to an account with
  none, refuses when the account already has one, and denies requests without the key.
- The multiplayer Docker image builds (`docker build -f multiplayer/Dockerfile .`).

**Mechanical defence** (`engineering.md` Tools), on the final code: PASS.
- typecheck, build, 75 tests, client bundle, design tokens, literal grep, SSR link.
- `npm --prefix multiplayer run check`: 12/12 pass.

**Left to the human's own testing:** gameplay — playing whole deals at the table, the steps' pacing,
the settlement dialog's new lines, the day's last deal leading to the result. Also the signed-in path
through Clerk (claim on sign-in from the browser).

## Deviations

- **The table has its own page, `/daily/play`**, instead of opening inside `/daily`. The frame
  follows the path, and only a table path gets the full-screen frame. As a result, a reload lands back
  on the table.
- **Totals on the info board** show every seat's Seeger-Fabian for the day. The plan only named the
  player's total.
- `DAILY_DEALS` / `DAILY_TIME_ZONE` moved into `lib/skat/tournament.ts`, because the multiplayer image
  copies only `app/src/lib/skat/`. `lib/daily.ts` re-exports them.
- Proposed solution: the deals are stored, not derived from "date + server key". That means no new
  secret.

## Environment

- Ports actually used: web **55035**, multiplayer **56035**, database **57035** (all running for review).
- **Added** to `app/.env`: `MULTIPLAYER_URL` and `MULTIPLAYER_ADMISSION_KEY`. Production equivalents
  were approved in grill Q1 and take effect only at deploy.
- **Changed** in the worktree's `multiplayer/.env`, for this ticket only and **not** to sync back:
  - `DATABASE_URL` port → 57035 (the ticket's own database);
  - `DOCKER_CONTEXT` `colima-skatgo` → `colima`, because the `colima-skatgo` context no longer exists
    on this machine. The main checkout still names it, so its local DB script fails until that value
    changes. Reported, not changed.
- Production at deploy:
  - multiplayer first; its `migrate()` creates `daily_deals` and `daily_entries`;
  - then web with the two keys (`operations.md` Deploy order).

## Residual

- SKATGO-36: the leaderboard reads `daily_entries` (index on `(day, total)` when it is needed).
- SKATGO-37: reviews replay from `daily_entries.actions` and `daily_deals`.
- Charter drift, reported and not fixed:
  - `product.md` still says Chinese, English and German, but the site has `en` and `de`;
  - `ui.md` names registry files that no longer exist (`skat.stylex.ts`, …).
