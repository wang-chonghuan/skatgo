# SKATGO-251 plan

## What the code says that the ticket does not

- A League deal is drawn in two places only: the first deal when a table is formed (`league.ts` `form`, `poolDealOf`)
  and every next one (`league.ts` `leagueDeal`, called from `room.ts` with the rooms' `pick`). Private rooms and free
  play draw from the same 1000-deal pool through `room.ts` `pick` and `free.ts`; they stay as they are.
- A pool deal stores the deck, the dealer and each seat's SkatZero plan `{ maxBid, decisions }`; `deal(dealer, deck)`
  gives the forehand the first ten cards, so turning the dealer by k turns every hand by k with the same deck — a stored
  deal can be dealt for any dealer, its plans turned with it. Roles (forehand/middle/rear) survive the turn.
- The plans are what persona seats bid with (`s.plans`), what the result page's AI game is played from
  (`/league/review`), and what free play's "play again" of a League deal from the record uses (`/free/again`, the
  record key `league:<pool>:<id>:<seat>:<match>:<deal>`, `LEAGUE_KEY`). The key's pool part takes any name without a
  colon, so `league@<day>` fits it unchanged.
- One seat's plan costs one `seatBidding` (231 skats): about 1 s locally, about 12 s on production (the daily
  tournament's log: 6 deals, two seats and an AI game each, ≈ 181 s). Three seats a deal ≈ 35–40 s there.
- The daily tournament already prepares today and tomorrow ahead in the leader (`prepareDays`, at start, then hourly,
  one at a time, abandoned after an hour); the League's pool follows the same pattern.
- A failing League step (`leagueDeal` throwing) is retried by the room (`advance` → `retry`), so a table with no deal
  available waits for the next one rather than breaking.
- Grill Q1: no copy anywhere — the page and its texts stay as they are.

## Route

1. **Daily pool** (`multiplayer/src/league-pool.ts`, new): table `league_pool (day, n, dealer, deck, computers,
   strongest)` and `league_seen (player, pool, pool_id)` in `store.ts`'s migration. `prepareLeaguePools` (leader, beside
   `prepareDays`, at start and hourly): for today and tomorrow (Berlin `dayOf`), add deals until the day has
   `LEAGUE_POOL_DEALS` (300; an env value of the same name overrides it, for the tests): a cryptographic shuffle, a
   random dealer, each seat's plan as the free pool makes it (`seatBidding` → `{ maxBid, decisions }`, moved from
   `scripts/make-free-pool.ts` into `src/free.ts` so both use one), and the strongest hand's role (highest `maxBid` ≥ 18,
   a tie to the earlier position; none when all would pass). Each deal is inserted as it is made, so a restart keeps the
   work. One preparation at a time; it logs `league_pool_prepared`.
2. **Dealing** (`league-pool.ts` `leagueDealFor`): the candidates are the day's deals none of the table's people has
   been dealt (`league_seen`), plus the day before's while today's is not complete. Each person is the target with
   chance min(1/2, 1/people); a target gets a deal whose strongest hand sits in the role their seat has under this
   deal's dealer; with nobody targeted (one person, the other half) a deal where that person does not hold it. Turn it to
   the table's dealer, mark it seen for every person, and hand it on as a `PoolDeal` named `league@<day>` / `n`. No
   candidate: `Rejected('not_ready')` (the page already says it), the room retrying the step.
3. **League** (`league.ts`): `form` and `leagueDeal` deal through `leagueDealFor`; `room.ts` stops passing `pick` to
   `leagueDeal`. `/league/review` reads a `league@` deal from `league_pool` (turned to the dealer the table had), and an
   older deal from the free pool as now.
4. **Play again** (`free.ts` `/again`): a `league@` deal of the record comes from `league_pool` and travels in the
   sealed token (`deal`), so `/act`, `/resume`, `/replay`, `/review` and `/odds` play it like a pool deal; before the
   skat it has no prepared odds, as a League deal from another seat has none today.
5. **Page**: unchanged — no copy is added or changed (grill Q1).
6. **Charter**: product.md's League paragraph — fresh cards each day, the strongest hand half the deals, and the
   sentences on equal players amended (the ticket's Constraints); engineering.md's League entry and the preparation;
   operations.md's query for a day's pool.
7. **Tests**: `league.test.ts` inserts its own small pool (deals taken from the free pool) and runs with
   `LEAGUE_POOL_DEALS` small; a unit test samples `leagueDealFor`'s choice 2000 times for one, two and three people.
