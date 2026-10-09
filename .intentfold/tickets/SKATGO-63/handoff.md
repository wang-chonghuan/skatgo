# SKATGO-63 handoff

## What changed

**The tournament page lists all of the day's deals** (`/de/taeglich`, `/en/daily`).

- `daily-comparison.tsx`:
  - `VsAiTable` takes an optional `of` (the day's number of deals) and `current`. The deals not yet finished follow the finished ones as plain rows, not buttons: the number, "läuft" / "in progress" for the deal being played or "offen" / "not played" for the rest, and "–" under the AI and the difference. Nothing of their cards is sent or shown. The total row appears only once a deal is finished.
  - Without `of` nothing changes: the in-game fold "Tagesverlauf" on `/daily/play` still lists only finished deals (grill Q5).
  - New `DayDeals`: the panel "Die Spiele von heute" / "Today's deals" around that table (grill Q2). It replaces the "Du gegen die AI" panel, which used to appear only after the first finished deal.
- `daily-table.tsx`: `DailyEntry` shows `DayDeals` for the whole running day, above "Heute spielen" / "Weiterspielen". While the status loads it shows its `waiting` prop.
- `daily-page.tsx`: the server renders `DayDeals` with 6 "offen" rows and the "Heute spielen" link (grill Q3). The browser shows the same while the status loads, so the page does not jump; then it fills in the visitor's own day.
- Messages: `daily_deal_open`, `daily_deal_current` added; `daily_vs_ai_title` removed (no longer used).
- **Charter** (approved by the human in the grill, product.md Redline 1):
  - `product.md`: the day's page lists all of the day's deals from the start, the rest by number as in progress or not yet played, never with their cards.
  - `ui.md`: `VsAiTable`'s row in the widget table describes `DayDeals` and the unplayed rows.
- No new design value: unplayed rows use the table's existing grid, `typography.small` and `color.slate`.

## AC results

Local web 55063, multiplayer 56063, database 57063, with today (2026-10-09) dealt locally at 6 deals. Headed Playwright (`tmp/ac63.mjs`), desktop 1280×820 and phone 375×812, each a fresh signed-out context. Deals were driven through `/api/daily/*` with scripted legal moves.

1. **A visitor who has not played sees all 6 deals, each unplayed, with no cards.** Met.
   - `/de/taeglich` and `/en/daily` at both sizes: "Die Spiele von heute" / "Today's deals", 6 rows numbered 1–6, each "offen" / "not played". No card in the panel, no total row.
   - With JavaScript off, the server's HTML already holds the same 6 rows, in both languages.
2. **After deal 1: still 6 rows, deal 1 with its result, the other 5 unplayed.** Met.
   - Row 1 shows −194, equal to the status's deal-1 score; then "2 läuft", "3–6 offen" (English "in progress" / "not played").
3. **All 6 finished: every row shows its result.** Met.
   - The day's result table has 6 finished rows (−194 / −386 / −338 / −194 / −290 / −434), each equal to the status's score, and no unplayed row.

At both sizes: no horizontal overflow, no page errors. Screenshots in `tmp/` (`ac-fresh-*`, `ac-one-*`, `ac-done-*`).

**Mechanical defence**: passed in full. typecheck, build, 101 tests, client bundle (23 chunks), design tokens, literal grep, SSR link, `check:seo -- --built` (44 indexable, 4 noindex, 4 linked files), `test:seo` 25/25.

## Deviations

- None from `plan.md`. Every grill recommendation was taken.

## Environment

- Ports 55063 / 56063 / 57063. Web and multiplayer are left running for review; the local database container `skatgo-multiplayer-db-57063` is running.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` port were pointed at the ticket ports for local acceptance only.
- **No env key added, changed or removed.**

## Residual

- `engineering.md` describes `daily-comparison.tsx` as "one collapsible row per finished deal"; still true of the finished rows, but it does not mention the unplayed rows or `DayDeals`. Not edited: only product.md and ui.md were approved.
- A returning player sees the 6 "offen" rows for a moment before the browser fills in their results (accepted in grill Q3).
