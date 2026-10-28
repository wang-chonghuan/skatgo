# SKATGO-145 plan

## What the code already says that the ticket does not

- The after-deal dialog has three AI-compared branches in `game-table.tsx` `Result`/`Actions`: the daily one
  (`dailyAfter`: `DealVsAi` + calculation line + "after n of 6" + button + `DealAnalysis`), free play and lesson 11
  (`askReviewed`: good/bad `Panel` with the title, `FreeVsAi`, calculation line, button, `DealAnalysis`), and the
  passed-in dialog (`Say` + `DealVsAi`/`FreeVsAi` + the "after" line). The private table's branch (`roomAfter`) is
  the fourth and stays as it is.
- Everything the new blocks need is in `DealReview` already, for every context: `auction` / `aiAuction`
  (daily `daily.ts`, free `free.ts`), `mine` / `ai`, `differs` (worst first), `tricks` (claimed tricks left out),
  `hand` (the ten cards at the start of play). No server change.
- The daily dialog has no result card today; free play's has the good/bad `Panel` with the title only. The new
  result card is that `Panel` for all three: `tone good` (`goodSoft`) on a win, `bad` (`badSoft`) on a loss.
- `settlementFormula` (i18n.ts) builds the one-line calculation from `Settlement`; the rows are built from the
  same parts. It stays for the private table's settlement.
- The free round's summary (`server-table.tsx`) has no review per deal: the reviews are fetched per token and
  dropped. Its rows can open to the same blocks only if the round keeps each deal's review — kept in the `Round`
  state that already goes to `localStorage` with the round (an old stored round without it reads as none).
- Lesson 11's `explain` line ("the play record shows it under yours") explains the record, which goes.
- The dialog is `dims.dialogWidth` inside a 16px scrim with 24px padding: about 295px of content on a 375px
  phone. Ten `xs` cards (34px) do not fit one row; the hand wraps to two rows.
- Existing roles and tokens cover it: `dialogTitle` for the title and the big score, `note`/`small` for labels,
  `smallBold`/`appBtnStrong` for values, `panelLabel` for block headings, `Who` tags, `PlayingCard size="xs"`,
  `border.focus` outlines in `navy`/`info`. No registry change.

## Route

1. **Calculation rows** — `settlementRows(r, d, bid, declarer, me, names)` in `lib/skat/i18n.ts` beside
   `settlementFormula`: `[label, value][]` — base value, multiplier, game value (Null: its fixed value),
   overbid when it applies, the outcome step (won `+ 50`, lost `−2 × v − 50`, defenders `+40`), ending in the
   player's Seeger-Fabian score. Unit-checked with the existing formula cases.
2. **`daily-comparison.tsx`** — replace `ScoreSheet`'s per-deal use, `TrickReplay`, `DealAnalysis`, `FreeVsAi`,
   `DealVsAi` with:
   - `ResultCard` — the `Panel` with "Your side won!/This game is lost", the score, the rows.
   - `VsAiReview({ ask, cacheKey, names })` — fetches the review once and renders `BidCompare` then `WorstTrick`;
     loading and failure lines as today.
   - `BidCompare` — one row per side (Who tag, what was said and the game, the outcome with card points, the
     score); one row with both tags when the two rows would read the same (grill Q2).
   - `WorstTrick` — "Trick n: the AI would play X", the cards already on the table, the hand before it with the
     player's card outlined navy + You tag and the AI's outlined blue + AI tag, then who took it with the points.
     A clean deal: one line. A passed-in deal: nothing.
   `ScoreSheet` stays for the /daily total sheet. `VsAiTable` rows open to `VsAiReview` (daily: `dailyAsk`; free
   round: the kept review).
3. **`game-table.tsx`** — all three AI-compared branches render ResultCard (not when passed in) → `VsAiReview` →
   the button. Drop `DailyAfter`'s `day`, `analysis`; drop the early-claim line and the skat from these branches.
4. **`server-table.tsx`** — keep each finished deal's review in the round (`reviews`), pass it to `VsAiTable`.
5. **Messages** en/de — new keys for the rows, the bid lines and the trick heading; remove keys no longer used.
6. **Charter** — amend `product.md` (the after-deal, free-play and articles paragraphs) and `ui.md` (the
   `ScoreSheet`, `VsAiTable`, `DealAnalysis`/`TrickReplay` component rows) to the new screen, as the ticket asks.
7. Tests: update the acceptance/unit specs that assert the removed sheet/record, after the code is done.

## Redline lookup

- ui.md R1 (registry change): none planned — existing roles/tokens only. R2/R3: StyleX only, no literals.
- engineering.md R3 (dependency): none. R5 (generated files): none. R7: only replaced assertions change.
- operations.md: local DB and services only; no production data touched.
