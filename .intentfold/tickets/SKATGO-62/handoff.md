# SKATGO-62 handoff

## What changed

- **`app/src/lib/skat/tournament.ts`**: `DAILY_DEALS = 6`, down from 12. Everything follows this one constant:
  - the server deals the day, checks deal numbers and knows when a day is over (`multiplayer/src/daily.ts`);
  - the titles, meta descriptions, the page text and "Spiel n von m" take it as a parameter.

  No copy had 12 written into it.
- **`multiplayer/src/daily.ts`**: a comment. The dealer still moves clockwise every deal, so the player sits in each position twice in six deals (it was four times in twelve).
- **`app/public/og/daily-{de,en}.png`**: the preview pictures, which had "12 Spiele" / "12 deals" in them, were redrawn by SKATGO-50's `og.mjs` from the built pages' new titles. They now read "6 Spiele" / "6 deals".
- **`.intentfold/tickets/SKATGO-62/wipe.cjs`**: the production step for cap4, run the way the human decided (grill Q1, Q2).
  - Without `--yes` it lists every day's deal count and every day's entries.
  - With `--yes` it deletes all `daily_entries` and all `daily_deals` in one transaction.
  - It needs only `pg` and `DATABASE_URL`, so it runs as a Render one-off job in the multiplayer service's own image.

The ticket's constraint and AC 3 were changed on the human's word ("不用考虑现有的纪录和牌局，现有纪录和牌局可以删除"); this is recorded in a ticket comment.

## AC results

Local web 55062, multiplayer 56062, database 57062. The fresh database was dealt by the new code: each day took about 15.5 s against about 31 s before. Headed Playwright (`tmp/daily62.mjs`) at desktop 1280×820 and phone 375×812. The day was driven through the page's API: the player bid on and played a Grand Hand every deal, so the scores are not all 0.

1. **A new day shows 6 deals; 6 deals finish it and reach the board.** Met at both sizes.
   - `/de/taeglich` reads "Das tägliche Skat-Turnier: 6 Spiele, eine Rangliste"; `/en/daily` reads "Today's Skat challenge: 6 deals, one leaderboard".
   - Both descriptions name 6, and the preview image is the redrawn `daily-{de,en}.png`.
   - `status.of` is 6. The day was finished after 6 deals, with no seventh.
   - After a nickname, the player is on the board with −1596.
2. **The AI comparison and the total cover exactly 6 deals.** Met at both sizes.
   - `/api/daily/state` has 6 deals and 6 AI results; the total of −1596 is the sum of the six deals' scores.
   - The result table on `/daily` has 6 rows, and its total row reads −1596.
3. **No 12-deal day or record remains after the release.**
   - Checked locally: the local day was made a 12-deal day with 4 finished entries. `wipe.cjs` listed them on a dry run, then deleted 4 entries and 2 days. The next request answered `day_preparing` and re-dealt today and tomorrow, 6 deals each, with no entries left.
   - Production is checked at deploy, in cap4. The order is the human's (grill Q2):
     1. deploy multiplayer;
     2. run `wipe.cjs` as a dry run, then with `--yes`;
     3. send one request to start the re-deal;
     4. run a read-only listing, which must show only today and tomorrow, 6 deals each, and no entries;
     5. deploy web.

No page errors.

**Mechanical defence**: passed in full — typecheck, build, 101 tests, bundle (23 chunks), tokens, literal grep, SSR link, `check:seo -- --built` (44 indexable, 4 noindex), `test:seo` 25/25. `npm --prefix multiplayer run check`: 21/21.

## Deviations

- **Production**: every daily record is deleted at release, instead of keeping the dealt 12-deal days (the ticket was amended on the human's word). No code reads a 12-deal day.
- **Local Docker disk**: the colima VM's disk was full (40 GB, shared with other projects).
  - To start this ticket's database I removed only this project's local acceptance databases for tickets already merged and closed (`skatgo-multiplayer-db-570{35…57, 59}` with their anonymous volumes) and SKATGO-61's local check image.
  - I kept 57058 (ticket 58 under review), 57061 (61 not yet closed), the main checkout's 3222, and everything belonging to other projects.

## Environment

- Ports 55062 / 56062 / 57062. Web and multiplayer are left running for review; the local database container `skatgo-multiplayer-db-57062` is running.
- The worktree's `.env` port lines were pointed at the ticket ports for local acceptance only. No env key added, changed or removed.

## Residual

- **Charter drift, not edited**:
  - `product.md`: "every day the same 12 deals";
  - `operations.md`: the production preparation time of "about 6–6.5 min" is for 12 deals; roughly half now.
- **Docker disk**: the VM still has only about 1 GB free. The largest volume (13 GB) belongs to another project.
