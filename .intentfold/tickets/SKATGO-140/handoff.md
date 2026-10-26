# SKATGO-140 handoff

## What changed

- **Elo** (`multiplayer/src/daily.ts`): counts SKATGO-77's twelve-deal days beside the six-deal ones (`ELO_SIZES`), each
  day of each its own game against those who played it and the AI's total of it; "?" until 5 games, as before.
- **Kit** (`ui.tsx`): `Modal`, the settings' dialog made reusable — title and X, the dim and Escape close it, the page
  behind locked and inert, focus in and back. The settings (`frame.tsx`) and the Elo explanation use it.
- **Elo explanation** (`elo-board.tsx`): three lines in a `Modal` — one game a day against everyone and the AI; higher
  Seeger-Fabian wins, start 1500, AI 1700; "?" under 5 days. Four old lines' messages removed.
- **Header menu** (`frame.tsx`): a dim under it that closes it and takes the tap; Escape; closes on a link or a page
  change; the page does not scroll while it is open.
- **Charter**: product (Elo games), engineering (`ELO_SIZES`), ui (`Modal`, the board's "?", the menu).

## AC results

Local web 55140, multiplayer 56140, database 57140, production's six- and twelve-deal rows, aliases and names copied
read only; the owner's records with their Gmail account (`.intentfold/tmp/demo-me.sh`).

1. New board from real data: Julien 1651, Mark 1540, Bunte Eule 1506 ?, Blaue Möwe 1505 ?, Konanekane 1497 ?, Wendiger
   Adler 1490 ?, yz 1456, Wyong 1448, Olena 1352. Konanekane: 4 games (10-16, 10-17, 10-21, 10-24); tonight's six deals make 5.
2. `tmp/ac.mjs` ALL PASS: the explanation three lines in view, closing by X, dim and Escape (phone, PC); the menu closing by
   X, dim (the tap reached nothing), Escape and a link (phone).
3. The settings dialog closes by X, dim and Escape; the page scrolls again after.

Mechanical defence: passed (283 tests, tokens, literal grep, SSR, SEO built, SEO tests). `npm --prefix multiplayer run
check`: 30 passed.

## Deviations

The settings dialog moved onto the kit's `Modal` (same behaviour), so there is one dialog, not two.

## Environment

Ports: web 55140, multiplayer 56140, database 57140. No env change.

## Residual

None.

## Check

1. http://localhost:55140/en — sign in with your Gmail: your record and the new Elo board; tap "?" and the menu.

## Decided for you

- A day's six and twelve deals are two games.
- The explanation is a centred dialog like the settings.
