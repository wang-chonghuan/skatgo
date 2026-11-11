# SKATGO-184 rework

Relative to the frozen `handoff.md`.

## Round 1: dim the cards at night (d7d074c)
- **Asks:** 「请问牌面有没有方法简单调暗，而不用换图？」, then 「做一下，我看看效果」.
- **Changed:**
  - `cardFace` keeps white by day and becomes `#D8DCE1` at night, about 85% brightness.
  - The card's drawing (face and back SVG) is multiplied onto it (`mixBlendMode: 'multiply'`, the card isolated). The whole card dims evenly, court art and backs included, with no new art.
  - The ticket's constraint and AC changed from "cards unchanged at night" to "cards slightly dimmed at night, unchanged by day", amended live in Plane with a comment. `ui.md` and `ac.md` follow.
- **Shown:** 90%, 85% and 80% on the same deal (`card-dim-levels.png`). 85% was built.
- **Rechecked:** the full AC script, 31/31 PASS. The card check is now "white by day, `rgb(216, 220, 225)` at night", and day still equals production element by element. Token and literal checks pass.

## Questions answered, no change
- Common night modes in card games: most dark the table and UI and keep the cards white; few dim them; a separate night deck needs new art.
- How the choice is remembered: the `skatgo_theme` cookie.
- The default: follow the device. Recommended to keep, because older players who never change their phone's setting see no change.

## Net effect against the handoff
The playing cards are no longer identical day and night: at night they are dimmed evenly. Everything else is as handed off.
