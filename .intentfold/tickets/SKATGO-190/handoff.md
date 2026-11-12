# SKATGO-190 handoff

## What changed
- `multiplayer/src/profile.ts`: the record's query takes from each tournament deal only its dealer, deck and the AI's
  summary, built in SQL, instead of the whole stored deal with the AI's complete game.
- `app/src/components/skat/deal-history.tsx`: the history table's borders are separate (spacing 0), so the list keeps its
  right padding on the front card.

## AC results
1. Owner's production records and decks in the ticket DB (58 days, 300 deals): old and new query return the same entries,
   dealers, decks and AI summaries; specs 3793 kB → 324 kB. On skatgo.com before the fix: profile ~700–900 ms vs xp
   ~300 ms from the same browser.
2. Production build, desktop and phone: 20 rows, 16px between the vs AI score and the list's right edge. Screenshots
   `tmp/desktop-home.png`, `tmp/phone-home.png`.
Mechanical defence passed; multiplayer `check` passed (69 tests).

## Deviations
None.

## Environment
web 55190, multiplayer 56190, database 57190. No env keys changed.

## Residual
- From the reviewer's region every request to skatgo.com costs 200–600 ms of network alone (robots.txt timed the same);
  this ticket removes the profile's own extra, not that.

## Check
1. Front card: the vs AI score has room on its right.

## Decided for you
- Only the query and the table's border mode changed; the rows look the same.
