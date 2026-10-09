# SKATGO-63 plan

## What the code already does that the ticket does not say

- `/daily` (`daily-page.tsx` → `DailyEntry` in `daily-table.tsx`) renders the personal part in the browser only. Until the status arrives, `DailyEntry` renders nothing; the server renders only the "Heute spielen" link in its place.
- Mid-day, the "Du gegen die AI" panel (`daily-so-far`) appears only once at least one deal is finished. It is `VsAiTable` (`daily-comparison.tsx`): one row per **finished** deal, then a total row.
- When the day is finished, `DailyResult` already shows `VsAiTable` with all 6 rows. AC3 is met today and needs only to keep working.
- The table's in-game fold "Tagesverlauf: n von 6 Spielen" (`game-table.tsx`) also uses `VsAiTable` (`flat`). It is on `/daily/play`, not the tournament page.
- `DailyStatus` gives `of` (6), `deal` (the current deal, 0-based), `started` and `finished`. Nothing about an unplayed deal is sent, and nothing needs to be: the row shows only its number.
- **Charter**: `product.md` says the comparison is "a table of both that grows by one row per deal, also on the day's page", and `ui.md` says `VsAiTable` has "one row per finished deal". A table of all 6 rows on the day's page changes both sentences (grill Q4).

Settled in the grill: all recommendations taken.

## Route

1. `VsAiTable` gets an optional `of`. When given, the deals not yet finished follow the finished ones as plain rows, not buttons:
   - the deal's number;
   - a status word where the scores go: "läuft" / "in progress" for the deal being played, "offen" / "not played" for the rest;
   - "–" under the AI and the difference.
   Without `of` (the in-game fold), nothing changes.
2. `DailyEntry`, while the day is not finished: the panel is always there, with `of={status.of}`, above the "Heute spielen" / "Weiterspielen" button. The total row is shown only once a deal is finished.
3. Server rendering (grill Q3): the same panel with `deals=[]` and `of=DAILY_DEALS` (6 rows "offen") is the fallback of the `ClientPart` and what `DailyEntry` shows while the status loads, so the page does not jump.
4. Messages: the status words in `de.json` and `en.json`. The panel's heading while the day runs is the existing `daily_play_title` ("Die Spiele von heute" / its English), in place of "Du gegen die AI" (grill Q2).
6. Charter (approved, grill Q4): `product.md`'s and `ui.md`'s sentences about the table say the day's page lists all of the day's deals, unplayed ones marked, no cards.
5. No new design value: unplayed rows use the existing grid, `typography.small` and `color.slate`.

## Files

- `app/src/components/skat/daily-comparison.tsx`
- `app/src/components/skat/daily-table.tsx`
- `app/src/components/skat/daily-page.tsx`
- `app/messages/de.json`, `app/messages/en.json`
- `.intentfold/charter/product.md`, `.intentfold/charter/ui.md`
