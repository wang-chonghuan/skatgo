# SKATGO-141 plan

## Found in the code

- `game-table.tsx` keys every table line on `course` / `hints` (only the course's tables have hints). SKATGO-134 gave
  the real tables, in the bidding, `bid_asked_short` ("18?"), `bid_hold_short` ("Yes"), `bid_forehand_alone_short`, and
  no line on the speaker's turn (`SpeakerBid`, `bid_your_turn` only with hints).
- The full lines are still in the messages and still used by the course: `bid_your_turn`, `bid_asked`, `bid_hold_button`,
  `bid_forehand_alone`.

## Route

1. `SpeakerBid`: `bid_your_turn` on every table.
2. Asked to hold: `bid_asked` and `bid_hold_button` on every table; `bid_asked_short` and `bid_hold_short` removed from
   both message files (unused then).
3. Forehand alone keeps its short line on real tables.
4. `ui.md` "What a table says": the bidding part follows.
