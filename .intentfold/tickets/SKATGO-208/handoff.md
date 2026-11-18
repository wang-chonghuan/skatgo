# SKATGO-208 handoff

## What changed
- The table's side panel, Bidding: each of the three columns may shrink to its third of the panel, so a long player
  name ends in the ellipsis its style already had instead of widening the column and pushing the third one out
  (`app/src/components/skat/game-table.tsx`, `auctionCol` gets `minWidth: 0`).

## AC results
Production build, web 55208, `tmp/ac.mts`, 1280×820 (panel pinned) and 375×812 (drawer):
1. AC1 PASS both widths — three long names: columns 103/103/103 px (phone 94/94/94) inside the panel, no horizontal
   overflow, each name ends in "…". With the old column minimum the same names gave 316/333/302 px, out of the panel.
2. AC2 PASS both widths — the table's own short names: column widths identical to the old minimum.
3. AC3 — both widths above. Screenshots `tmp/bidding-long-PC.png`, `tmp/bidding-long-phone.png`.
Look through the human's eyes (fresh reviewer, Request + screenshots): OK.
Mechanical defence: PASS (typecheck, build, app tests, client bundle, design tokens, no raw styles, SSR link, SEO
built + 28 SEO tests).

## Deviations
None from plan.md; the route is the ticket's proposed solution.

## Environment
Ports web 55208, multiplayer 56208, database 57208. No env key added, changed or removed.

## Residual
None.

## Check
1. A table with long names: the Bidding names end in "…" and the three columns stay in the panel.

## Decided for you
- Truncate with an ellipsis, each name in its third of the panel; the full name stays on the seat plate on the felt.
