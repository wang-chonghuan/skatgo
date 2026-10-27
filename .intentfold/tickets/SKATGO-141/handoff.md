# SKATGO-141 handoff

## What changed

- **Bidding on every table** (`game-table.tsx`): the lines SKATGO-134 had kept for the course's tables only are back on
  free play, the daily tables, private tables and a shared deal's practice:
  - on the player's turn to bid, "Your turn to bid to Noah – the next number, or jump higher." /
    "Du reizt Noah – sag den nächsten Wert oder spring höher." (`bid_your_turn`);
  - asked to hold, "Lina asks you: "18?"" / "Lina fragt dich: „18?“" (`bid_asked`) with the button "Yes (I'll play 18
    too)" / "Ja (ich halte 18)" (`bid_hold_button`).
  - Forehand alone keeps its short line, "Both passed – play at 18?"; everything after the bidding as SKATGO-134 left it.
- **Messages**: `bid_asked_short` and `bid_hold_short`, unused now, removed in both languages.
- **Charter** (`ui.md`, "What a table says"): the bidding part follows the request.

## AC results

Local web 55141, multiplayer 56141, database 57141; `tmp/ac.mjs` on free play, each visit a fresh deal, no game played.

1. **Speaker's turn names whom** — passed: "Your turn to bid to Noah – the next number, or jump higher." over
   "Bid 27 / Pass / Higher …" (`tmp/en-speaker.png`).
2. **Asked names who and what yes means** — passed: "Lina asks you: "18?"" with "Yes (I'll play 18 too) / Pass"
   (`tmp/en-asked.png`, phone `tmp/phone-asked.png`, no sideways scroll); German "Lina fragt dich: „18?“" with
   "Ja (ich halte 18) / Passe".
3. **Nothing else changed** — passed: the diff touches only the two bidding branches; forehand alone still "Both passed –
   play at 18?"; the course's lines are the same messages as before.

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built check, SEO
tests).

## Deviations

None.

## Environment

Ports: web 55141, multiplayer 56141, database 57141. No env change.

## Residual

None.

## Check

1. http://localhost:55141/en/play — the bidding panel at the first decision (reload for a new deal: you bid, or you are
   asked): is this the amount of text you wanted back?

## Decided for you

- Restored: the speaker's line, the asked line and the "Yes (I'll play 18 too)" button — SKATGO-134's originals.
- Kept short: forehand alone ("Both passed – play at 18?"), and everything after the bidding (skat, putting away,
  contract, play, settlement).
