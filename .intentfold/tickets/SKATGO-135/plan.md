# SKATGO-135 plan

## What the code says that the ticket does not

- The server already renders the final button, "1 deal today · 2 min" to /daily (`DealOfDayLink` in `entry-page.tsx`).
  In the browser `DealOfDayButton` (`deal-of-day.tsx`, loaded through `client-part.tsx` and `pages.tsx`) reads the
  day's state and board and, once played, swaps it for "Today's result · #k". Nothing else uses it.
- `useDealOfDay` stays: `/daily`'s `DealOfDay` uses it.

## Route

1. The hero renders `DealOfDayLink` alone; `DealOfDayButton` and its two lazy re-exports go.
2. `dod_hero_done` and `dod_hero_done_unranked` go from both languages.
3. Charter `ui.md`'s hero line: the button stays the same once played.
