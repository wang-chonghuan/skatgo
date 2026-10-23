# SKATGO-123 handoff

The tournament's Elo, computed from every ended day, and its board in the front page's hero: two columns on PC,
one under `bp.cards`, folded on a phone.

## What changed

- **The rule** — `app/src/lib/skat/elo.ts` (new): start 1500, the AI fixed at 1700, a day = one game against
  everyone else that day and the AI by Seeger-Fabian total (win 1, draw ½, loss 0), FIDE's expectation averaged
  over the opponents, change K × (score − expectation) with K 40 for the first 30 days and 20 after,
  provisional under 5 days. `elo.test.ts` (new): the worked examples (+30 / −10 against the AI alone, +11
  against a field, a draw, no game alone without the AI, K's switch).
- **The service** — `multiplayer/src/store.ts`: table `player_aliases (player, same_as)`.
  `multiplayer/src/daily.ts`: `dailyElo` replays every day before today (Berlin) from `daily_entries` and the
  stored benchmarks, folds aliased ids into one person under their current name, answers the top ten, the
  number of players and the AI's value; route `POST /daily/elo` (asks as nobody).
- **The web** — `app/src/lib/daily-handler.ts`: `callDaily` (the service call, shared), `elo` among the ops,
  asked as nobody. `app/src/lib/elo-api.ts` (new): the server reads the service directly (a minute cached),
  the browser through `/api/daily/elo`. `app/src/routes/index.tsx`: the loader reads the announcement and
  the board together.
- **The hero** — `app/src/components/skat/entry-page.tsx`: with a board, a grid of `dims.twoColumns`
  (`dims.oneColumn` under `bp.cards`), the text kept to the left; without one, as before.
  `app/src/components/skat/elo-board.tsx` (new): a Panel with the title, the rows (rank, name, number, "?"
  when provisional) with the AI's row by its value, one quiet line saying what "?" means, and a fold with the
  rule in words and numbers; on a phone folded behind a line with the title and the leader. After the look
  through the human's eyes it was made shorter (the sentence on how it is counted moved into the fold, no
  header row, tighter rows, the hero aligned to the top): 518 px instead of 614, the tiles from 678 px instead
  of 774 at 1280×820, their first row in full on the first screen.
- **Messages** — `elo_*` in `app/messages/{en,de}.json`.
- **Charter** — `product.md` (the Elo beside the daily boards), `ui.md` (the hero's two columns, the board),
  `engineering.md` (the route, the rule's module, `player_aliases`), each as the human asked.

## AC results

1. **Every player has an Elo; through 2026-10-23 it equals the ticket's list.** PASS — the rule on
   production's tournament rows (copied locally, read-only) through 2026-10-23 gives Julien 1599, Mark 1550,
   Konanekane 1511?, Bunte Eule 1506?, Blaue Möwe 1505?, Wendiger Adler 1490?, Alice 1490?, yz 1453?, Wyong
   1451, Olena 1430 (`tmp/ac1.ts`); the local service asked as of 2026-10-24 answers the same (`tmp/ac5.mts`).
   `elo.test.ts` passes.
2. **Julien and Mark appear once.** PASS — with the merges as `player_aliases` rows (locally: 6 ids → Julien,
   1 → Mark), `/` and `/en` list each once, in the HTML the server sends (`tmp/ac.mjs`).
3. **PC hero two columns.** PASS — 1280×820, `/` and `/en`: headline 87–461 px, board from 682 px, side by
   side, rows visible, no fold (`tmp/ac.mjs`, `pc-*.png`).
4. **Phone: the board folded.** PASS — 375×812 touch: one line "Elo ranking · 1. Julien · 1599", rows hidden;
   a tap opens all ten (`tmp/ac.mjs`, `phone-*.png`).
5. **A day moves its players once it ends.** PASS — the service as of 2026-10-23 leaves that day out (Wyong
   1459), as of 2026-10-24 counts it (Wyong 1451) (`tmp/ac5.mts`).

Mechanical defence: typecheck, build, 282 unit tests, client bundle, design tokens, literal check, server
bundle link, `check:seo --built`, `test:seo` — all pass. `npm --prefix multiplayer run check` passes.

## Deviations

None from `plan.md`. Of the Proposed solution, rule 7's preview of today's change right after playing is not
built (grill 12): the acceptance criteria do not ask for it.

## Environment

Ports: web 55123, multiplayer 56123, database 57123 (a local container holding a copy of production's
tournament tables and the two merges). No env key added, changed or removed.

## Residual

- A visitor's own Elo on the board (their row when they are not in the ten, or a line to play for one) —
  check 1.
- At close, production needs the two merges as `player_aliases` rows (the human's 「ju开头……mark」), written
  by hand after the service's deploy creates the table, then the multiplayer service and the web deployed —
  multiplayer first, since the web calls `/daily/elo`.
- A guest who signs in carries only that day's entry to the account; earlier guest days stay apart unless
  merged by hand. Carrying them at sign-in would be its own ticket.
- Today's preview right after playing (grill 12).

## Check

1. http://localhost:55123/ — the board shows the top ten only: a visitor does not yet see their own Elo
   there or a line inviting them to play for one. The look through your eyes raised it against
   「还想通过我的系统来参与，看到自己的elo分」; not built, since the ticket asks for the list (Residual).
2. http://localhost:55123/ — the PC hero: type on the left from the top, the board on the right (518 px);
   the white space under the ✓ line beside the taller board, and whether the tiles start high enough (678 px).
3. http://localhost:55123/ — under the board: the "?" line and "So wird gerechnet" — whether the rule reads
   clearly.
4. http://localhost:55123/en at phone width — the folded line "Elo ranking · 1. Julien · 1599", and the list
   after a tap.

## Decided for you

- A day counts once it has ended at midnight in Berlin; today's results are not in the number yet.
- The merges live in a database table, not in code (player ids may never be committed).
- A merged player stands under the name they hold now: "Julien", and the account's "Mark".
- Ten rows, the AI's row among them by its value, not ranked — as on the daily board.
- Provisional numbers carry a "?"; the fold says what it means.
- On PC the hero's text is left-aligned beside the board, both from the top; tablets get one column with the
  board open.
- The sentence on how it is counted is the fold's first line, not under the title, to keep the board short.
- The AI's row carries the blue "AI" tag on the German page too, as everywhere (your 「AI标志都用app里那个蓝色的Ai
  标志」), while the German sentences say "KI".
- Players who stopped coming stay on the list with their number.
