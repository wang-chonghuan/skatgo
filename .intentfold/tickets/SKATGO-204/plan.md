# SKATGO-204 plan — League

## What the code already promises, and what the ticket does not say

- **Rooms** (`multiplayer/src/room.ts`, `model.ts`): a Colyseus room per table, snapshot in `multiplayer_rooms`,
  30 s grace then autopilot (SkatZero from the pool's per-seat plan), restore after restart, one room per account
  (`store.roomOf`), 128 live rooms at most, six-digit ids that double as the private room's number.
  The room keeps the current `Game` but no move log; reviews need one.
- **Free play's review and XP** (`free.ts` `/review`, `computers.ts`): everything is seat 0 (`PLAYER`). `deal()` deals
  by role, so a room seat `k` is seat 0 of the same deck dealt by `viewSeat(dealer, k)`, the log's seats turned the
  same way — the review, the AI's game and `play_deals` work unchanged on the turned deal. The table already turns the
  room so the viewer is seat 0 (`roomGame`), so the review's seats are the dialog's.
- **Personas** (`personas/config.ts`, `play.ts`): `population(500)` is deterministic; the legacy `personaPolicy` only
  wraps `choose`, so it works in any seat; the `/2` strength adapter assumes seat 0 and is not reused.
  The persona runner's enable switch governs the batch board simulation, not this.
- **Day boundary**: `dayOf` (Berlin), as the ticket asks.
- **Home**: `entry-page.tsx` four tiles (`tileNavy` is the bidding practice's), picture cards friends · forum ·
  tricks, the tricks card at half of the third column; the right half is the empty slot.
- Not said by the ticket, decided in grill.md: what "today's coins" shows, when the check-in fires, persona strength
  bands, review/XP of a deal an absent player's AI played, history rows of league deals, leaving mid-round, the
  Legend board's tie order, page addresses and indexing.

## Route

### multiplayer

1. **Store** (`store.ts` migrate): `league_players` (player PK `user:…`, coins, tier 0–5, points, checkin_day, updated_at),
   `league_matches` (id = room id, tier, seats jsonb, created_at, finished_at, result jsonb),
   `league_deals` (match, deal, pool, pool_id, dealer, log jsonb; PK match+deal). No new service or resource.
2. **Rules** in `app/src/lib/skat/league.ts` (shared with the page): `TIERS` (ids, fees 10/12/15/20/25/30),
   `ROUND_DEALS = 3`, `PLACE_POINTS = [3, 1, -2]`, `UP = 12`, `DOWN = -8`, `CHECKIN = 100`, `placesOf(totals)` (ties take
   the better place), `standingAfter(tier, points, place)` (promotion/relegation, Bronze never down, Legend never up,
   points to 0 on a change). Unit-tested.
3. **`multiplayer/src/league.ts`**: routes under `/league` behind the admission key —
   `state` (tiers; for an account coins, tier, points, checked-in-today, live table, Legend board),
   `checkin`, `play` (the 5-second match: in-memory per tier, up to 3 humans, then personas; coins checked and the fee
   taken in the transaction that stores the room and the match), `review` (one deal for the asking account, its seat
   turned to 0; records `play_deals` once, key `league:<pool>:<poolId>:<seat>:<match>:<deal>`), `board`.
   Personas: `population(500)` sorted weakest → strongest by `play.mistake`, six equal bands, tier i draws from band i;
   never a persona already at a live league table or with a board activity due within 30 min, never a name a human holds.
4. **Room** (`model.ts`, `room.ts`): `Snapshot.league?` (tier, match, the seats' personas, each deal's pool id and log,
   the result). League rooms are created by the matcher (`matchMaker.createRoom` with a trusted option, like restore),
   deal at once (random first dealer), accept only their seated accounts, play persona seats with `personaPolicy` on the
   pool's plan, log every move, store each finished deal in `league_deals`; after the third deal the round is scored and
   applied in the same transaction (`league_players`, `league_matches.result`), the room marks itself finished and
   short-lived; `roomOf` and `/rooms/*` ignore finished league rooms and never admit anyone to a league room by number.
   Persona seats publish as players (`kind: 'human'`, connected, never counted for `next`).
5. **Personas skill** (`.agents/skills/skatgo-personas/`): scope and rooms.md allow League seats.

### web (`app/`)

6. **`lib/league-handler.ts`** `/api/league/*` (state, checkin, play, ticket, review), wired in `server.ts` like
   `/api/room`; `lib/league-api.ts` the browser's calls.
7. **Check-in**: one POST from the frame after mount for a signed-in account (`skat-layout.tsx`), once per load.
8. **Pages** (`client-page.tsx` chunks; routes `/league` and `/league/play`, German `/de/liga`, `/de/liga/spielen`,
   noindex): `league-page.tsx` — H1, the player's card (tier, points with what is left to promotion/relegation, coins,
   the one `go` "Play · N coins", or why not, or "Back to your table"), the six tiers with fees, the Legend board, a
   guest's sign-in; `league-table.tsx` — matching line, then `GameTable` in room mode with a `league` variant (menu
   without number/kick, "Deal n of 3", the result with XP and the AI comparison through `review`), the round's result
   (place, totals, ±points, promotion/relegation, play again / back).
9. **Home**: the League tile in the bidding practice tile's place (lucide `Trophy`, `tileNavy` as built; other colours
   shown as screenshots), the bidding practice as the fourth picture card in the third column's right half with a new
   picture in the existing flat style (`app/public/bidding-card.webp`, Azure `gpt-image-2`).
10. **Messages** en/de; **Charter**: product.md (League; SKATGO-180's sentence, as the ticket says), ui.md (front page,
    League pages), engineering.md (League in the stack/structure; its own "no public matchmaking" line, which the
    request contradicts).

### Slices, in order

1 rules + store → 3 league routes + 4 room → 6 web handler → 8 pages + 7 check-in → 9 home → 10 charter → calibration.

## Redline lookup (before code)

| Action | Entry | Verdict |
|---|---|---|
| new tables in multiplayer's PostgreSQL | operations 3 (cloud resources) | not a resource; schema in the existing DB — clear |
| new dependency | engineering 3 | none planned (lucide, Colyseus, zod present) — clear |
| token registries | ui 1 | none planned: `tileNavy`, `dims.half`, `homeWaysNarrow`, existing roles. A new tile colour only if the human picks one from the screenshots (then their approval) |
| editing product.md | product 1 | the ticket's Constraints authorize it (人的请求即授权) |
| engineering.md's "No arena or public matchmaking" | — | contradicts the human's request → amended in this ticket, recorded in a comment |
| route files import only client-page | engineering 4 | followed |
| production data | operations 2 | acceptance is local only |
| image generation (Azure gpt-image-2) | — | existing practice (SKATGO-147/149/167); no new resource |
