# SKATGO-32 handoff — table messages: nothing overflows, hints never covered

## What changed (`game-table.tsx`)

- **Info board:** its first cell's second line is "Bidding" during bidding and nothing afterwards. The
  "Waiting for the game to be announced" line is gone (message `table_awaiting_contract` removed). That
  state is still said by the running line ("Max is looking at the skat…").
- **New top container** (`skat-top`): the board, then a message area (`skat-messages`) right under it,
  sized like the hint width (`dims.tipWidth`).
  - A refusal ("you must follow …") and a hint appear there as panels (`Message`: tip or bad tone), each
    with a close button (new message `message_close`, "Close" / "Schließen").
  - Hints no longer render in the running-words stack or inside the action drawer.
- **Table and felt use `overflow: clip` instead of `hidden`.** A hidden overflow can still be scrolled
  by focus or `scrollIntoView`; during this check it slid the felt 83px sideways on a phone.

## AC results (built server, 55032; gameplay itself not played beyond passing)

- **AC1 — PASS.** At 375 the board's first cell reads "Current bid 18 / Bidding" during bidding. From the
  announcement on it shows the contract; the long "waiting" line is no longer rendered anywhere on the
  board.
- **AC2 — PASS.** At 375:
  - The bidding hint showed under the board at 163–245px, above the drawer (486px) and the hand (651px).
    Close removed it.
  - After passing, the trick-play hint (lightbulb tab) showed at 163–269px, clear of the hand (651px).
  - The felt's scroll stayed at 0 throughout.
- **AC3 — PASS.** At 1280 the bidding hint showed under the board, and the page height equals the
  viewport (820).
- **Mechanical defence — PASS** (75 tests).

## Deviations

The `overflow: clip` change was found during the check and fixes a related sideways shift.

## Environment

Web on 55032, left running for review. No env key changed.

## Residual

None.
