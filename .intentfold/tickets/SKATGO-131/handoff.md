# SKATGO-131 handoff

## What changed

- **Server** (`multiplayer/src/daily.ts`, `pick.ts`): the deal of the day is the day's tournament of size 1
  (`DEAL_OF_DAY`, `DAILY_SIZES` in `lib/skat/tournament.ts`). State, act, board and review take a `size` (6 when none);
  Elo stays size 6; the record of play (SKATGO-128) counts every size. `prepareDays` prepares the six deals, then the
  deal of the day: fresh random candidates (never one of the day's six), each worked out like a tournament deal (both
  computers' bidding, the AI's game from the player's seat), sorted by the AI's game into four kinds — declared and
  won with 61–89, won Null, won Schneider or better, defended and brought the declarer down — and one picked: never
  yesterday's kind, a contract the last two days have not had where offered, the closest win first. Rounds of 8 up
  to 64; each pick and the kinds offered are logged (`daily_deal_chosen`; `daily_deal_kind_repeated` only if 64
  candidates offer nothing but yesterday's kind). The pick's kind and contract are stored with the deal.
- **Guests** may play the deal of the day (`/api/daily/*` lets a guest play size 1; the six deals still need an
  account).
- **Front page**: the main button "1 deal today · 2 min" / "1 Spiel heute · 2 Min." leads to `/daily` (the human:
  「这个应该是入口……不要一进去马上打牌」); once played "Today's result · #k" / "Heutiges Ergebnis · Platz k"; the second
  button is free play; no forum in the hero (the announcement left the front page's loader too).
- **/daily** (`daily-page.tsx`, `deal-of-day.tsx`): its way in to the deal reads "Play now · 2 min" / "Jetzt spielen ·
  2 Min." (not the front page's words twice); title and lead now name both ("Daily Skat: 1 deal or a tournament
  of 6"); a toggle "1 deal today | Tournament · 6 deals" (`?t=6`, noindex); the deal of the day's side — before
  playing its button to its table (`/daily/play?size=1`); after, the score block (yours, the AI's, players and place),
  "Share your result" as the one `go` (share sheet on a phone, clipboard elsewhere; `lib/share.ts`), the countdown to
  midnight in Berlin, today's board with the AI's row (a guest who has not played sees it too), then folded "How the AI
  played this deal", then a link to free play. The
  tournament's side is unchanged.
- **The deal's table**: after the last card the result stands 1.8 s, then the page goes to `/daily`.
- **Link previews** of `/daily` redrawn for the new title; unused hero messages removed; analytics `dod_shared` and
  `home_cta_clicked` `free`.
- **Charter**: product, engineering, ui.

## AC results

Local web 55131, multiplayer 56131, database 57131. `tmp/ac.mjs` (PC 1280×820, phone 375×812, English and German):
all passed. `tmp/seven-days.ts` (own database): all passed.

1. **Hero** — passed: for a guest the main button leads to `/daily` (`/de/taeglich`), where the toggle offers 1 deal
   and 6 deals and the deal's button leads to its table; the second is free play; no forum link in the hero. With a
   finished entry (written to the local database for the test account, not played) the main button reads "Today's
   result · #2" and leads to `/daily`. *Changed by the human during development: not straight to the table.*
2. **After the deal** — passed: `/daily` shows the toggle (1 deal current), the score block (+10, AI +40, "2 played
   today · you're #2"), "Share your result", the countdown, today's board with the AI's row, and no tournament line.
   The share text carries no card and no contract (`share.test.ts`). The move from the table after the last card is
   left to the human: it needs a deal played through.
3. **Seven days of choosing** — passed: 1–7 Nov: close win, Schneider win, defended, close win, Schneider win,
   defended, Schneider win; neighbouring days always differ; contracts suit and Grand; none is one of its day's six.
   8–16 candidates a day, 20–40 s and ~400 MB locally (production prepares the six in about 3 min, so a deal of the
   day there may take a few minutes more; inside the hour). The first run failed (two close wins in a row, the
   fallback after 32 candidates) and led to the fix above.
4. **Tournament unchanged** — passed: the toggle's other side shows the tournament's way in and board; Elo reads
   size 6 (unchanged query); all existing tests green.

Mechanical defence: passed (typecheck, build, 282 tests, bundle, tokens, literal grep, SSR import, SEO built check —
after marking `?t=6` noindex — SEO tests). `npm --prefix multiplayer run check`: passed (30).

## Deviations

- The front page's button leads to `/daily`, not the table (the human, during development).
- `/daily`'s title and lead changed to name both competitions; its link previews redrawn.
- `?t=6` is noindex: the same page turned to the other competition.

## Environment

Ports: web 55131, multiplayer 56131, database 57131. No env change. The multiplayer service needs no new variable;
the first deploy prepares today's and tomorrow's deal of the day on its own.

## Residual

- A null win is rare among candidates (none in 7 days locally); it comes up when offered.
- The tournament's side of `/daily` keeps the tournament's own explanation below it (the course of the page).

## Check

Raised by the look through your eyes, not changed (your call):
- The explanation under /daily ("The same cards for everyone…") and the page's tab title still describe only the
  6-deal tournament (account, Elo).
- The toggle's words and the board's small labels are the site's existing small styles.
- On a PC the result card's content keeps to its left; on a phone "Free play" wraps under the green button.

1. http://localhost:55131/ — the front page's main button and its words, and that it opens /daily.
2. http://localhost:55131/de/taeglich — the toggle and the "1 Spiel heute" side; play today's deal through, and see
   the result stand on the table and the page come back with your result, place and share.
3. http://localhost:55131/en/daily — the same in English; "Share your result" on a phone and on a computer.

## Decided for you

- Guests play the deal of the day (asked: 游客能打).
- It counts in the record of play, not in the Elo.
- Equal scores share a place on its board.
- The header's "Tagesturnier" link keeps its name and opens /daily on the deal of the day.
- The forum's announcement left the hero; it stays on /daily and in the header and footer.
- The result stands 1.8 s on the table before the page moves on.
