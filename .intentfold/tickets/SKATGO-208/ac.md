# SKATGO-208 acceptance check

`tmp/ac.mts` against the ticket's production build (web 55208), free play `/en/play`, at 1280×820 (panel pinned) and
375×812 (drawer opened). Long names are written into the three name heads in the page, so the check needs no table of
long-named players.

1. AC1 — three long names: every column inside the panel, no horizontal overflow, the three equal, each name ends in
   an ellipsis. Also measured with the column's old minimum (`min-width: auto`) to show the bug it replaces.
2. AC2 — the table's own short names: the columns as wide as with the old minimum.
3. AC3 — 1 and 2 at both widths.
