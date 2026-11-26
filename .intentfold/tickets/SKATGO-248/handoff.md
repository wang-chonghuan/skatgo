# SKATGO-248 handoff

## What changed
- **Hard hands** (`/hard-hands`, DE `/de/schwere-blaetter`): five kinds, the player always declaring a set game — one-Jack suit game, short trumps (≤ 4 in the ten), one-Jack Grand, Null with one weak spot, good hand in a bad seat (from middlehand). List page `challenge-page.tsx` `ChallengePage`; table `/hard-hands/play?kind=&n=` (`ChallengePlayPage`, never indexed).
- **Table**: starts at the skat step (seat 0 declarer, bid 18); one line "Your game: …" and only "Pick up skat", then the discard; the server declares the set game after the discard. Result: the player's deal beside SkatZero's run of the same cards and game, the AI's biggest differences; foot "Next deal" / "Same hand again" (ten and skat kept, the other 20 re-dealt). No XP line, no totals.
- **Service** `multiplayer/src/challenge.ts`: pool loader (checked), sealed token as free play's, routes `new` / `act` / `review` / `again`; `discardFor` in `skatzero/bidding.ts` (SkatZero's discard for a set game); `replayLog`/`playsOf` take a start state. Web `/api/challenge/*` (`challenge-handler.ts`, free play's per-address limits).
- **Pool** `multiplayer/skatzero/challenge-pool.json`: 30 deals a kind, picked by `multiplayer/scripts/make-challenge-pool.ts` from 154–170 found per kind (each judged over 40 lies of the other 20 cards; bad seat also ≥ 90 % from forehand), spread evenly from the highest rate (easiest) to the lowest. Shared rules `app/src/lib/skat/challenge.ts`.
- **Front page**: the advanced course card is replaced by "Hard hands" with a new picture (`hard-hands-card.webp`, option D of three non-table drawings, Azure `gpt-image-2` with the Skat Tricks and advanced course cards as style references); the advanced course stays reachable from the course page.
- Messages EN/DE, localized addresses, sitemap, OG images `og/hard-hands-{en,de}.png`, charter product/ui/engineering.

## AC results (local 55248 / 56248 / 57248)
1. PASS — five kinds listed in order.
2. PASS — each kind: skat phase, seat 0 declarer, the ten of its kind, no Hand button, "Your game: …", declared game = the kind's.
3. PASS — a deal played to the end shows the result and "If the AI had played your cards" with the AI's score.
4. PASS — same ten (page state); the deck re-dealt except ten and skat (service test opens the token).
5. PASS — `make-challenge-pool.ts --check`: 30 a kind, rates 0.5–0.9, ordered, patterned, bad seat front ≥ 0.9; a resample of 3 a kind gave rates near the recorded (±0.1–0.2, estimates over 40 lies).
6. PASS — no `league_deals` row, League points unchanged.
7. PASS — front cards: four tiles, friends, forum, tricks, hard-hands; no advanced; the course links the advanced course.
8. PASS — 30 a kind, highest rate first (service test and `--check`).
Mechanical defence green (app: 370 tests, check:seo 68 pages; multiplayer: 74 tests).

## Deviations
- `sitemap.ts` lists the two new pages (its test is the spec); the play address answers without a query (private pages must answer 200).
- "Same hand again" uses the table's own uncounted result (no "Replay" wording): a challenge is not a replay.
- After the fresh-eyes look: the table wears the table frame (no site header/footer), the board says the bid 18 and "Deal n of 30", the side panel shows no empty auction, and the list cards drop the repeated "30 deals" line.

## Environment
Ports 55248 / 56248 / 57248. No env keys added, changed or removed.

## Residual
- Kinds left for later per the ticket: lone Ten, strong side suit, two-Jack Grand, Null Ouvert defence, Schneider target.

## Check
1. Front card picture: D (weightlifter with card stacks); alternatives E (tightrope) and F (house of cards) in `.intentfold/tmp/SKATGO-248/card/`.
2. `/en/hard-hands` wording of the five kinds.
3. A deal's table and result (`/en/hard-hands/play?kind=one-jack-suit&n=1`).

## Decided for you
- Names: "Hard hands" / "Schwere Blätter"; addresses `/hard-hands`, `/de/schwere-blaetter`.
- Counted nowhere (no XP, record, board, League); guests play everything; no stored progress — deal number in the address.
- Kinds 1–4 from forehand, the bad seat from middlehand; the bad seat's game is SkatZero's own choice of suit or Grand.
- Null's weak spot: exactly one suit where some card lacks enough lower cards beneath it.
- No Hand games in this batch; the game is said before the pick-up.
