# SKATGO-166 handoff

## What changed

- `game-table.tsx` — `DealResult`, one after-deal dialog for a private table and every table against the AI (the
  tournament, free play, lesson 11), the passed-in deal included: the box (good / bad, white when all passed) with only
  the title ("Noah (AI) lost Grand Hand") and one reason line ("59 : 61 card points"); `ScoreTable`, the board's names
  in the board's order over "This deal" (bold) and "Total" (the board's totals; none for lesson 11's one game); the
  skat; the calculation in one line without the scores; the AI review in its after-deal form. The course's own table
  keeps its teaching `Result`. `ResultCard`, the room's standings lines and the passed-in dialog's own text are gone.
  Free play's and lesson 11's board totals are Seeger-Fabian now (the round so far plus the deal just finished), so the
  board and the result agree; the free-play strip's total follows them.
- `daily-comparison.tsx` — `VsAiReview` `after`: "The AI in your seat" with its score, rows only where the AI differs
  (its bidding, or how the same bidding ended), the trick without the "Biggest difference" heading, the record without
  the skat. The record's table is set in the dialog's four levels (16 bold, 16, 13 bold). `GameTag`, `SeatScores` and
  their styles removed; `gameName` exported.
- `i18n.ts` — `resultReason` and `calcLine` in place of `settlementRows`; tests in `formula.test.ts`.
- `server-table.tsx` — the round passes each seat's totals; `table-room.tsx` — no standings lines.
- `shape.stylex.ts` — `dims.scoreColumns`. Messages en/de: the titles, reasons, calculation parts, table rows,
  "The AI in your seat"; unused result/standings messages removed.
- Charter: `product.md` (what a player sees after a deal), `ui.md` (A deal's result, `VsAiReview`, the copy line).

## AC results

Checked on a private table (`tmp/accept.mjs`, output `tmp/accept.txt`, 38 PASS): a host and two computers start, a
second person comes in as a newcomer whose seat a computer plays, the host leaves, three computers play the deal out
(no game played by the check), the newcomer reads the result at 1280×820 en, 375×812 de, 375×812 en, 1280×820 de.

1. Box — pass: two children, title and reason ("Noah (AI) lost Grand Hand" / "59 : 61 card points"; "Noah (KI) hat Grand
   Hand verloren" / "59 : 61 Augen"; last run "Lina (AI) won Diamonds ♦" / "72 : 48 card points"), tinted.
2. Score table — pass: names = the board's in its order; "This deal" = the deal's Seeger-Fabian scores (−242 +40 +40,
   0 0 +68); "Total" = the board's totals in the first run, and left out in the last, a room's first deal, where it was
   the deal's own row (after the look below).
3. No repetition — pass: the deal's scores only in the table (the calculation no longer names the defenders' +40), the
   card points once, the skat once with two cards, no old "This game:" / "Total:" / "Calculation:" lines.
4. Type levels — pass: 22/800, 16/600, 16/800 in this dialog (the AI part adds only the tags' 13/800).
5. Against the AI — not reached: only a played free-play or tournament deal shows it, and the check plays no games.
   Covered by typecheck and the unit tests; the look is left to your own deal.
6. Passed in — did not come up in this run; the same component draws it.
7. No sideways scroll, no page errors — pass at all four views.

Mechanical defence: pass (`tmp/defence.log`: typecheck, build, 322 tests, client bundle, design tokens, literal grep,
SSR link, SEO built + test:seo). Multiplayer code unchanged.

The look through your eyes (a fresh reviewer with your request and earlier asks): "Total" repeated "This deal" on a first
deal — fixed, the row is left out while it equals the deal's; the calculation wraps to two lines on a phone when the
multiplier has several parts — kept, first in Check; "Noah (AI)" wraps in the phone's header — kept (a long name wraps
rather than losing its end).

## Deviations

- The calculation line drops "each defender +40" (planned in it): the table already shows the defenders' +40.
- The score table is a grid, not a fixed table: the row names take their own width and a long name wraps on a phone.

## Environment

Ports: web 55166, multiplayer 56166, database 57166. No env keys added or changed.

## Residual

None.

## Check

1. The calculation line on a phone: two lines when the multiplier has several parts ("Diamonds ♦ 9 × 2 (without 1 + game
   1) = 18 · won: 18 + 50"). The reviewer expected you to want one line (「那个公式占用的行数太多」); shortening it means
   dropping the multiplier's parts.
2. Free play: play one deal to the end — the AI part under the result (its score, a bidding row only when it differs,
   the trick, "Every trick vs. the AI" opened).
3. The private table's result on the phone: the box, the score table, the skat and the calculation line.

## Decided for you

- The calculation stays visible as one line and stops before the score (it is the table's).
- Free play's and lesson 11's board totals now count Seeger-Fabian, as the result's Total does.
- The AI part shows only what differs; when the AI bid and ended the same, only its score.
- The skat is in the result; the folded record no longer repeats it after a deal (it keeps it on /daily's rows).
- All passed: the same dialog in a white box, "All three passed", the table with this deal's zeros.
- No Total row where it would repeat "This deal": a room's or round's first deal, lesson 11's single game.
