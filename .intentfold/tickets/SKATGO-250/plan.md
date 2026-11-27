# SKATGO-250 plan

1. `PlayingCard` and `Fan` take an optional `deck`, overriding the settings' deck for that drawing only.
2. `challenge-page.tsx`: each kind's look is a ten-card hand (shorthand `cards(...)`) and its game; the stage shows
   `Fan row` with `deck="german"`, sorted by `sortHand` for the kind's contract, padded so the tint shows at the sides.
3. Charter ui.md line for the page; a test that each typical hand is of its kind (`ofKind` on the hand).
