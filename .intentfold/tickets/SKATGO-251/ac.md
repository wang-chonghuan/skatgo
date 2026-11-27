# SKATGO-251 acceptance checks

Ticket services: web 55251, multiplayer 56251, database 57251 (the ticket's own local database; no production data
is touched by any check).

## AC1 — a day's pool of 300 new deals, ready before the day starts; the day's deals come from it

- Run the ticket's multiplayer with the default size; after preparation, query the ticket database: today's and
  tomorrow's pools each hold 300 deals, all decks different from one another and from the free pool.
- Play League deals in the ticket's product (Playwright, a few deals by hand-driven clicks, no bot play); every
  `league_deals` row since has the pool `league@<today>`.
- Pass: counts 300 / 300, no duplicate deck, every new League deal named after today's pool.

## AC2 — an account never gets the same deal twice

- Unit/service test: deal many times to one account from a small pool; no pool deal comes twice; once all are seen the
  account gets none (the table waits).
- Query over the ticket database after AC1: no account has two League deals with the same pool and number.
- Pass: no repeat in either.

## AC3 — the strongest hand: one person about 1/2; two people each about 1/2; three each about 1/3

- Command: sample the dealing choice 2000 times (dealing only, no play) for one, two and three people over a prepared
  pool. Pass: one person 46–54%; two people each 46–54%; three people each 29–37%, no two people more than 4 points apart.

## AC4 — no extra wait at Play or for the next deal

- Playwright on the ticket's product: Play → first deal on the table, and the next deal after a result, timed; compare
  with the same on main's code (main ports). Pass: no added wait (within a second of main's).

## AC5 — today's pool not ready: the League still deals, from yesterday's deals the account has not had

- Service test: today's pool empty, yesterday's complete → a table forms and deals; the deal is `league@<yesterday>`
  and new to the account.
- Pass: table formed, deal from yesterday's pool, unseen.

## AC6 — a finished deal from the daily pool shows its result with the AI's game, and its review

- Playwright on the ticket's product: finish a League deal; the result shows the AI's game on the same cards; open the
  review from the record of play and "play again" opens the same cards.
- Pass: result with the AI line, review opens, play-again shows the same hand.
