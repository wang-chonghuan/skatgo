# SKATGO-173 plan

## What the code says that the ticket does not

- The table asks a tournament deal's review with `dailyAsk(deal)`, size left out, so the deal of the day (size 1) is
  asked as the six deals' deal 0: it never comes for a player who has not played those, and with it no XP. The weekly
  board already counts the deal of the day (it reads every size's entries).
- The deal's XP sat inside `VsAiReview` (after the deal's own part), and a toast showed once over the page.

## Route

1. `game-table.tsx`: the deal of the day asks its review as size 1, cache key with the size.
2. `useReview` in `daily-comparison.tsx`: one fetch per deal shared by the result's parts; `DealXp` the result's first
   line, "XP …" while it comes; `XpEarned` without the toast and its rule texts.
3. Charter ui.md / product.md.
