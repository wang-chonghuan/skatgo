# SKATGO-218 plan

## What the code already says that the ticket does not
- The running card points are the info board's third cell (`InfoBoard` in `game-table.tsx`), which is itself a button:
  a tap switches it between card points and tricks (SKATGO-127), remembered in the browser's settings
  (`skatgo.settings.v2`, `boardTricks`). A second control cannot sit inside that button.
- The settings are per browser (localStorage), like every table preference; a key a stored settings object lacks takes
  its default, so a default of "hidden" reaches every player, new and existing.
- Lessons draw their own top (`exercise.top`), not the board; the result panel draws its own card points.

## Route
1. Settings: `boardPoints` (shown) false by default, `setBoardPoints`, kept with the others; `useBoardPoints()` false on
   the server and the first render, like `useBoardTricks`.
2. The cell: a wrapper takes the grid cell's place (its rules), the switch fills it as before, and the eye — lucide `Eye`
   / `EyeOff` at `icon.inline` — sits in its top-right corner as its own button, only while the cell shows card points.
   Hidden: "? : ?" where the numbers were. Title and label EN/DE: "Show card points" / "Hide card points", "Augen
   zeigen" / "Augen verbergen".
3. Charter ui.md: the board's points cell line.
