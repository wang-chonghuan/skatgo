# SKATGO-209 handoff

## What changed
- The League table (`app/src/components/skat/league.tsx`, `LeagueTable`):
  - Leaving it — the corner menu's "Tisch verlassen", the result's way out, "Zur Liga" — and the room letting the seat go
    (left, sitting closed, opened on another device) return to the League page without the table staying in the
    browser's history: the way back when the table was opened from the League page in this visit (`fromLeague`), else in
    the table's place (`replace`). Once per table (`went`).
  - The table address with no table to come to (`no_table`, or any `gone`) goes straight to the League page the same way;
    the "This table has closed." page is no longer shown at a League table.
  - The notice's "Zur Liga" link replaces the history entry.
- Charter ui.md: the League table's way back.

## AC results
Production build, web 55209 / multiplayer 56209 / db 57209, test accounts, 1280×820, `tmp/ac.mts`; a page-wide observer
records whether "This table has closed" is ever on the page:
1. AC1 PASS — Home → League → Play → table → "Tisch verlassen": League page; back: Home (`/en`); forward: the League page.
   Never the table address, closed text never seen.
2. AC2 PASS — `/en/league/play` with no table: lands on `/en/league`, closed text never seen.
3. AC3 PASS — table → back: League page with "Back to your table" → the same room (972227 → 972227); leaving it then and
   going back: not the table.
No deal was played (tables only opened and left). The human-eye look was skipped: nothing visual changed.
Mechanical defence: PASS (typecheck, build, 352 app tests, client bundle, design tokens, no raw styles, SSR link, SEO
built + 28 SEO tests).

## Deviations
Proposed solution said "replace" for leaving; with replace alone the history keeps the League page twice (League → table
replaced by League), so the way back looks dead once. Leaving now goes back to the League entry when the table was opened
from it, and replaces otherwise.

## Environment
Ports web 55209, multiplayer 56209, database 57209. No env key added, changed or removed.

## Residual
None.

## Check
1. On the phone (the Android app's back button): League → Play → leave → back goes to where you came from, never "This
   table has closed."

## Decided for you
- Every way a League table lets the seat go goes to the League page, opened on another device too (its old text, "table
  closed", was wrong there; the League page offers "Back to your table").
- Other table errors (unreachable, not ready) keep their notice.
- Opening the table still adds to the history, so back from a running table is the League page.
