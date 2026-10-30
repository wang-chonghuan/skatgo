# SKATGO-165 handoff

## What changed

1. **Deal number** (f157e00).
   - A room's table shows which deal it is: the board's line "Deal 3" / "Spiel 3", where free play shows "Deal 3 of 6", and the side panel's strip pill.
   - Changed: `RoomTable.deal` and `info_deal_n` in `game-table.tsx`; the board's `deal.of` is optional.
2. **Statistics** (b0b3bff, a51435a, and the score sheet after the review below).
   - Service:
     - `scoreEnded` records every scored deal into the snapshot's `history`: its `summarize` summary, and who sat where. A seat a computer played, a newcomer's waiting seat included, is recorded as a computer.
     - The public view carries `history` (`RoomDeal` in `room-view.ts`).
   - Table menu: "Statistics" / "Statistik" under the room number opens a dialog over the table (`Stats` in `table-room.tsx`). It is a score sheet:
     - the names once, in the board's order (left, You, right);
     - one row per finished deal: its number, the game ("Spades ♠ Hand", "Passed in"), and each seat's points, the declarer's in bold, pale where someone else sat that deal;
     - then the totals, with "Keep playing" at its foot;
     - a grid token `dims.statsColumns`.
   - With no finished deal, the dialog says so.
3. **Next deal waits for everyone here** (56fa97b).
   - Service:
     - `next` marks the seat (`nextBy`). `dealIfReady` deals once every person online (account and live session) has asked; with nobody online nothing is dealt.
     - Leaving, being taken out (`applyAction`) and dropping (`flushDrops`) re-check it.
     - A newcomer taking a seat clears that seat's mark.
     - The public view marks each seat `ready`.
     - A press that deals nothing is not a game change: `played` now follows whether the game object changed.
   - Page: once pressed, the settlement's and the passed-in dialog's button reads "Waiting for <names>" and is disabled. This goes through a `NextWait` context beside `Names`.
- **Tests:**
  - `rooms.test.ts` gains two integration tests:
    - waiting for everyone, then dealing on leave, kick, and when alone;
    - dealing when someone drops.
  - The statistics' entries are checked against each deal's Seeger-Fabian scores.
  - The newcomers test now has all three ask.
  - The hard-restart test read its snapshot while the computers could still be moving, and failed once here. It now reads the table only once it waits for the host again, which keeps its assertion exact.
- **Charter:** `product.md`, `ui.md` and `engineering.md`'s rooms text.

## AC results

- **1. Deal number.** `tmp/accept.txt` and `tmp/free.txt`. **Pass.**
  - Board reads "Deal 1", "Deal 2" after the next deal, "Deal 3" after that.
  - German phone reads "Spiel 1".
  - Free play's board still reads "Deal 1 of 6".
- **2. Statistics.** **Pass.**
  - Before any finished deal: "No deal finished yet."; closing returns to the table.
  - After one passed-in deal: one row "1 · Passed in · 0 0 0" under the names (the viewer "You"), totals 0.
  - German phone after two deals: two rows, "Eingepasst", and "Gesamt".
  - Played deals' entries match each deal's Seeger-Fabian scores and seating in the multiplayer test (`tmp/mp-check.log`).
- **3. Next deal waits.** Three accounts, all passing. **Pass.**
  - A pressed: "Waiting for B, C", disabled.
  - B still saw its own enabled button at deal 1. B pressed: "Warten auf C"; A then waited for C only.
  - C pressed: everyone at deal 2.
- **4. Alone with the AI.** Asking deals at once, in the multiplayer test; acceptance plays no game to reach a played-out deal alone. **Pass.**
- **5. No hanging.** **Pass.**
  - Browser: A and B asked, C closed the page, deal 3 came.
  - Multiplayer tests: leaving, being taken out, dropping.
- **6. Languages and widths.** English desktop and German phone in one run, 13/13. **Pass.**
- **Mechanical defence:** 320 tests, bundle, tokens, git grep, SSR link and SEO pass (`tmp/defence.log`).
- **Multiplayer check:** 44/44 (`tmp/mp-check.log`).

## Deviations

- **The statistics layout** changed after the look through the human's eyes. A fresh reviewer, given the Request, the grill and earlier preferences (「简洁直观」, 「每个人的得分，也不该占两行」), found the planned blocks not concise. Each took three lines and repeated all three names. It also noted the seats were not in the board's order. Both were fixed as a one-row-per-deal score sheet.
- The statistics dialog's button is wrapped like the settlement's, so it fills the foot (a51435a, found on the screenshot).
- The hard-restart test fix is outside the plan. It was needed because the test is timing-dependent; it now waits for a quiet table rather than loosening the check.

## Environment

- **Ports:** web 55165, multiplayer 56165, database 57165.
- **Env keys:** none added, changed or removed.
- **Deploy:** multiplayer first. An old page ignores `history` and `ready`. A new page against an old service would read no `history` and no `ready`, so deploy in order.

## Residual

- **Settlement lines wrap on a phone.** In a room's settlement, the existing lines "This game: You 0 · … " and "Total: …" wrap on a phone, splitting a name from its score. The reviewer raised it against 「每个人的得分，也不该占两行」. These lines predate this ticket and were not changed here.

## Check

1. The settlement's score lines wrap on a phone, splitting a name from its score. This is existing, and outside this ticket.
2. Open a room with a friend, or two browsers with two accounts, and play a deal to its end. Check that:
   - "Next deal" waits for both;
   - the board's "Deal n" counts up;
   - the menu's Statistics reads as one row per deal.

## Decided for you

- The menu item is "Statistics" / "Statistik", one word in the menu.
- The statistics are a score sheet: the names once, in the board's order, then one row per deal (game, points, declarer in bold), then the totals; nothing per trick.
- "Next deal" waits for every person online. Someone away, whom the AI plays for, does not hold it.
- The deal number shows where free play's shows: the board's line and the panel's pill, as "Deal 3" only.
