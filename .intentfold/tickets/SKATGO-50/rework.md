# SKATGO-50 rework

Relative to the frozen `handoff.md` (`700d2b6`).

## Round 1 — 「这两个地方小修一下，就关闭工单重新部署吧」(2026-10-06)

The human was told two things after the handoff: the rules page's banned-word test had been narrowed,
and the Charter lacked the bidding table page and the print rule. They accepted the test change as it
stands and asked for the two Charter places to be fixed, then the ticket closed and redeployed.

- `charter/engineering.md` (human-authorized): the route list names `/rules/bidding-table`; the path
  table gains `rules-page.tsx`, `bidding-table-page.tsx` and `lib/skat/rules/` with the anchored
  sub-headings and the engine-rendered numbers.
- `charter/ui.md` (human-authorized): the sub-page list names the bidding table; Responsive states the
  print rule (`bp.print`: header, footer and assistant off paper site-wide; the bidding table prints
  only its title and tables).
- The test is unchanged by this round.

Rechecked: no product code changed, so no criterion was affected; the mechanical defence ran once on
the final branch at close.

Net effect: the delivery is the handoff's, plus Charter text matching it. The Charter drift left from
SKATGO-48 (product.md's daily sentence, `DealSummary.detail`, `VsAiTable`) was not part of this ask
and remains.
