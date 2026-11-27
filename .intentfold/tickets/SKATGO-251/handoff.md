# SKATGO-251 handoff

## What changed

- **Daily pool** — `multiplayer/src/league-pool.ts` (new): each Berlin day's 300 League deals (`LEAGUE_POOL_DEALS`),
  a cryptographic shuffle and random dealer each, every seat's SkatZero plan, and the seat holding the strongest hand
  (`strongestSeat`: highest bid from 18, a tie to the earlier position). `prepareLeaguePools` fills today's and
  tomorrow's in the leader at start and hourly (`server.ts`, beside `prepareDays`), a deal at a time, each stored as made.
- **Dealing** — `leagueDealFor` / `chooseDeal` / `turned`: a deal none of the table's people has had (`league_seen`),
  from today's pool and yesterday's while today's is not complete; each person meant to hold the strongest hand with
  chance min(1/2, 1/people); the stored deal turned to the table's dealer with its plans. `league.ts`: forming a table
  and each next deal draw from it (`leagueDeal` no longer takes the rooms' `pick`; `room.ts` follows); with no deal
  left, forming answers `not_ready` and a sitting's next deal waits, still due and unpaid.
- **Review and play again** — `/league/review` reads a `league@<day>` deal from `league_pool`; free play's `/again`
  carries such a deal in its sealed token (`free.ts`: `PoolEntry`, `seenDeal(…, entry)`, `opened`, `reply`; no
  prepared odds before the skat for it). Older League deals keep reading free play's pool.
- **Shared plan** — `poolPlan` and `CODE` moved into `free.ts`; `scripts/make-free-pool.ts` uses them.
- **Data** — `store.ts`: tables `league_pool` and `league_seen`; `forget.ts`: an account's `league_seen` goes with it.
- **Tests** — `test/league-pool.test.ts` (new): strongest seat, turning, the share sampled 2000 times for one, two and
  three people, no deal twice, yesterday's pool, none left. `test/league.test.ts`: its own pool of 120 deals, every
  deal from today's pool, none twice per account, play-again of a pool deal gives the table's hand.
  `package.json` `test`: `LEAGUE_POOL_DEALS=0` so the test services make no pool of their own.
- **Charter** — `product.md` League paragraph (the cards; equal-players sentences amended, as the ticket's
  Constraints say); `engineering.md` League entry; `operations.md` a read-only query for the day's pools.
- No page or text changed (grill Q1).

## AC results

1. **300 new deals a day, ready ahead; the day's deals come from it** — PASS. Ticket service (56251, default size):
   `league_pool_prepared` 2026-11-27 300 deals (816 s) and 2026-11-28 300 (734 s) locally; 300 distinct decks a day, none
   shared between days or with free play's pool. A table formed on it (`/league/play`) dealt `league@2026-11-27` #206;
   in the service test every dealt deal is `league@<today>`.
2. **An account never gets the same deal twice** — PASS. `league-pool.test.ts`: 12 deals to one account, 12 different,
   then `not_ready`; `league_seen` has no duplicate. `league.test.ts`: no account has the same pool deal twice over all
   its sittings.
3. **Strongest hand ½ / ½ each / ⅓ each** — PASS. Sampled 2000 times over the ticket's own 300-deal pool: one person
   51.1%; two 50.4% / 49.6%; three 33.4% / 33.1% / 33.5% (by chance a seat holds it 32.4%). Unit test on free play's
   1000 deals within 46–54% / 46–54% / 29–37%, ≤ 4 points apart.
4. **No extra wait at Play or for the next deal** — PASS. The draw takes 1.5 ms median, 12.8 ms at most (50 draws on the
   ticket database); Play → seated 5103 ms, the League's 5-second wait for other people as before (the service test's
   4.9–6.5 s bound holds).
5. **Today's pool not ready: deal from yesterday's, unseen** — PASS. `league-pool.test.ts`: today empty → 12 deals all
   `league@<yesterday>`; today partly made → today's and yesterday's; today complete → only today's.
6. **Result with the AI's game, review, play again** — PASS at the service, as the League test drives a real table:
   each finished pool deal's review answers both games with the points stored; play again of a `league@` record deal
   returns the same hand the table dealt. Not played through in the browser (no games are played for acceptance); the
   pages themselves are unchanged.

Mechanical defence: app typecheck, build, test (376), client bundle, design tokens, git grep, SSR link, `test:seo`
(28) — pass. `check:seo -- --built` — pass (68 pages) with the game service unreachable; with the ticket's game
service up it fails `/en/forum` (under 200 characters) because the ticket's fresh database has no forum posts — no
web code changed here. `npm --prefix multiplayer run check` — typecheck, build, 81/81 tests pass.

## Deviations

- Plan step 5 dropped: no copy (grill Q1).
- `league_seen` is written when a deal is dealt, not when it ends, so a deal of a sitting that broke off counts as had.

## Environment

- Ports: web 55251, multiplayer 56251, database 57251 (`skatgo-multiplayer-db-57251` on Colima `skatgo`).
- New optional env key `LEAGUE_POOL_DEALS` (multiplayer; default 300, not set in production). No env key added to any
  `.env`. The worktree's own `multiplayer/.env` DATABASE_URL and `app/.env` MULTIPLAYER_URL point at the ticket ports
  locally; not to be synced back.

## Residual

- Production starts with no pool: right after the deploy the leader makes today's 300 at about 35–40 s each (about
  three hours) — the League deals from them as they appear; only in its first minutes can a table wait for a deal.
- Free play and private tables still deal from the 1000-deal pool (the ticket leaves them).
- An empty forum renders under 200 characters of SSR text, failing `check:seo` against a fresh database (pre-existing).

## Check

1. http://localhost:55251/en/league — play a few deals in the League as usual; nothing on the page changed, the cards
   are new each day and you should hold the best hand about every other deal.

## Decided for you

- Strongest hand = highest SkatZero bid from 18, a tie to the earlier position; all-pass deals have none.
- One person alone gets the strongest hand in exactly half the deals (the other half a deal where they don't hold it),
  not half plus chance.
- A stored deal is turned to the table's dealer, so all 300 deals serve every dealer (about 100 per position).
- Bidding simulation's skat order fixed by day, deal and seat (as the daily tournament's).
- Any deal dealt counts as had, even if its sitting broke off.
- With no deal left (first minutes after the first deploy) forming answers the page's existing "not ready" and a
  sitting's next deal waits unpaid.
- All tiers share one pool; two people may each get the same deal on their own tables the same day.
