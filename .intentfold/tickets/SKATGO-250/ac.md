# SKATGO-250 acceptance checks (web 55250; production build)

1. Six stages, each ten cards in one row, none rotated — Playwright: count `[data-card]` per stage = 10, computed transform
   of each card slot has no rotation.
2. German deck in the stages while the settings say tournament or jqk; the table's cards follow the settings — Playwright:
   `data-deck="german"` on every stage card with `skatgo.settings.v2` deck set to tournament; on /hard-hands/play the hand's
   cards carry `data-deck="french"`.
3. Each hand is of its kind and sorted for its game — unit test (`ofKind` on the ten, order equals `sortHand`).
4. Desktop 1280×820 and phone 375×812: screenshots; no card cut off but at most at the stage's edge.
