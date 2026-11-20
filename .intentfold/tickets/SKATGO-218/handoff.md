# SKATGO-218 handoff

## What changed

- **Setting** (`app/src/lib/skat/settings.ts`): `boardPoints` (card points shown), false by default, kept in the browser's
  settings with the other table preferences; `useBoardPoints()` false on the server and the first render. A stored settings
  object without the key takes the default, so existing players start hidden too.
- **Info board** (`app/src/components/skat/game-table.tsx`): the card points' cell is now a frame; SKATGO-127's switch is a
  button laid over the whole cell (a tap anywhere switches card points / tricks as before), and beside the numbers sits
  the eye, lucide `EyeOff` (hidden) / `Eye` (shown) at `icon.inline` in `onColorSoft`, its own button painted above the
  switch. Hidden, the numbers read "? : ?". In tricks mode there is no eye and nothing hides.
- **Messages**: `info_show_card_points` / `info_hide_card_points` — "Show card points" / "Hide card points", "Augen zeigen"
  / "Augen verbergen" (title and screen-reader label).
- **Charter** ui.md: the info board passage names the eye.

## AC results

Playwright on the production build, web 55218, free play `/en/play` and `/de/spielen`, PC 1280×820 and phone 375×812
(`tmp/ac.log`, `tmp/board-*.png`):
1. Fresh browser: the eye is there ("Show card points" / "Augen zeigen"), the cell marked hidden — PASS ×4.
2. A tap shows them and the choice is stored; still shown after a reload — PASS ×4. Every table draws this same board from
   the same setting; the daily table needs a started tournament, not opened here.
3. A second tap hides them, still hidden after a reload — PASS ×4.
4. The result panel is untouched by this change (it draws its own card points). Not observed: reaching a result needs a
   played deal.
5. The eye is on top where it is drawn, inside the cell, beside the numbers, below the label, on PC and phone; "Deal 1 of
   6" stays level with the totals' names — PASS ×4. SKATGO-127's tap still switches to tricks and back — PASS ×4. No page
   errors.

**Left to the human's own test**: the cell during a deal — "? : ?" while hidden, the numbers once shown.

Mechanical defence: app typecheck, build, test (353), client bundle, design tokens, literal grep, SSR link, SEO checks — pass.

## Deviations

From `plan.md`: the eye first sat in the cell's top-right corner and covered the label "CARD POINTS" in narrow cells; it
moved beside the numbers, and the switch became a layer over the cell so the eye could be its own button there.

## Environment

Web 55218, multiplayer 56218, database 57218 (worktree `multiplayer/.env` pointed at 57218, not committed). No env key
changed.

## Residual

None.

## Check

- The eye beside the card points: crossed out by default, open after a tap, and remembered.
- Play a deal: "? : ?" while hidden, the numbers once you open the eye.

## Decided for you

- The eye hides card points only; in tricks mode there is no eye (tricks lie on the table to count).
- Hidden shows "? : ?".
- The choice is kept per browser, like the points / tricks switch.
- The numbers and the eye are centred together, so the "—" sits slightly left of the cell's centre.
