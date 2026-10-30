# SKATGO-165 rework

One round after the handoff (5248085), one commit. `handoff.md` is unchanged.

## Round 1 — cc149b2

> 那个图标别用扑克牌的，最好用牌桌等图标，你lucid上想想

- **What changed:**
  - A room's table button (top right) shows lucide's `Users`, the people at the table, instead of the spade.
  - Candidates were rendered as the corner button draws them (`tmp/shots/icons.png`):
    - lucide's `table` icons are spreadsheet grids, which would read as the statistics;
    - `armchair` and `sofa` read as a living room at 20 px.
  - `ui.md` follows.
- **Rechecked:** `tmp/rework1.mjs`, 5/5:
  - the room's button is `lucide-users` on desktop and phone;
  - its menu is unchanged (Keep playing, the room number, Statistics, Leave the room);
  - free play keeps the way out.

## Net effect against the handoff

- Only the room's menu-button icon: people instead of a spade.
- The deal number, the statistics and the next-deal wait are as handed off.
