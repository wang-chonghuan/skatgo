# SKATGO-72 handoff

This work came through an open development phase; this file records what was delivered and verified,
not which tool or skill produced each edit.

## What changed

1. **A finished trick waits for the player's tap.** The three cards stay in the middle until the player
   taps; a tap anywhere on the screen collects them. This holds at every table: free play and lesson
   play, the daily tournament and private tables.
   - `app/src/components/skat/game-table.tsx`:
     - the local table no longer collects on a timer (`TRICK_DELAY` removed);
     - a new `Collect` element shows the hand in the gold frame's bottom-right corner. Behind it is
       a full-screen transparent button (`data-testid="skat-collect"`, portalled to `body`, `layer.window`);
     - each table type gains a `collect` callback.
   - `server-table.tsx`, `daily-table.tsx`, `table-room.tsx`:
     - the queue of server states holds at a `trickEnd` state until that state has been tapped (`collected === shown`);
     - the server's own game is unaffected. In a private table each viewer taps only for their own screen.
   - `app/messages/{de,en}.json`: `table_collect` ("Stich einsammeln" / "Collect the trick"), the button's accessible name.
2. **The hand.** A skin-coloured hand pointing up, a deep-blue outline, an arc over the fingertip, blinking (opacity 1 → 0.25 → 1, 1.2 s).
   - Redrawn as our own SVG after the human's pick, Flaticon "Tap" by Kiranshastry. Nothing was downloaded or copied, and the human chose the redraw over using the file.
   - It stays still under reduced motion.
3. **The declarer's seat letter is on red.** Once the auction has made someone declarer, their role tag uses `color.tileRed`; the other two stay `roleTag` green.
4. **The player's own seat plate looks like the others'.** It is dark (`plate`), no longer amber.

Registry additions, all asked for by the human in this ticket:
- `constants.ts` `tapHint` (the hand's paths, stroke, blink);
- `color.stylex.ts` `tapSkin` `#F6C4A0`;
- `shape.stylex.ts` `dims.tapHand` 48px.

## AC results

Checked on the built product at port 55072, driven by scripted legal moves (`tmp/look.mjs`), at desktop 1280×800 and phone 390×844.

1. **A finished trick waits on the table with the tap hint.** Met.
   - Free play and the daily tournament, desktop and phone: three cards still in the frame 3 s after the trick completed, and the hand shown in the frame's corner.
   - Private tables share the same hold logic but were not driven.
2. **Tapping collects the trick and play continues.** Met. The tap went to the screen's top-right corner, far from the hand, and the trick was gone 0.8 s later in every run.
3. **The declarer's seat letter is on red.** Met. In every run the declarer's tag computed `rgb(200, 40, 26)` and the other two `rgb(0, 122, 40)`.

Mechanical defence passed in full:
- typecheck and build;
- 101 tests;
- 21 client chunks clean;
- 120 token files clean;
- literal grep 0;
- SSR link;
- `check:seo --built`: 42 indexable and 6 noindex pages;
- `test:seo`.

## Deviations

- The Proposed solution's "a tap anywhere inside the gold frame" became "anywhere on the screen", at the human's request.
- The hand went through three looks at the human's direction: lucide outline, then skin with two rings, then the redrawn Flaticon-style hand.
- The amber own-plate removal was added mid-development at the human's request.

## Environment

- Ports 55072 / 56072 / 57072; local database container `skatgo-multiplayer-db-57072`.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` port were pointed at the ticket ports for local work only.
- No env key added, changed or removed.

## Residual

Charter drift, not edited:
- `ui.md` does not yet describe the tap-to-collect hand, the red declarer tag, or the own plate no longer being amber;
- its colour table does not list `tapSkin`.
