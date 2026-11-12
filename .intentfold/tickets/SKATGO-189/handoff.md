# SKATGO-189 handoff

## What changed
- `app/src/components/skat/deal-history.tsx`: one row for both lists (front card `DealLines`, record `DealRows`). A row is
  the game (or "Passed in"), the player's part as an outlined tag (Declarer navy / Defender slate, none when all passed),
  their jacks, then aces, then tens by suit, the day, on the record the Replay link (unchanged), and the difference to
  the AI (signed, uncoloured). Where there is room (> 480px) the list is a table, one line a game, columns lined up under
  "Game · Your jacks, aces, tens · vs. AI"; on a phone a game is two lines (game, tag, difference / cards, day) plus the
  Replay line on the record. The front card's version is a step smaller (game `panelLabel`, tag `label`, cards `meta` a
  thin space apart, tighter padding) so a hand keeps to one line and three games show on desktop.
- Removed: other players' names (`dealLine`), the result sentence, where it was played (`modeOf`), the ten cards.
- Messages (EN/DE): + `history_head_game`, `history_head_cards`, `history_declarer`, `history_defender`;
  − `history_cards`, `history_game`, `history_free`, `history_dod`, `history_tournament`.
- Charter, amended by the request: `ui.md` (front card and record rows), `product.md` (the card's line).

## AC results
Production build on 55189, multiplayer 56189, DB 57189 with the owner's records; script `tmp/ac.mjs`, desktop 1280×820
and phone 375×812, light and dark, `/en` and `/de` — ALL PASS on the final commit:
1. Front card: all 20 rows show a game or "Passed in", a Declarer/Defender tag except on passed rows, only B/A/10 card
   labels, a date and a signed difference; no "Lina"/"Max"/"Noah". (16 contexts.)
2. Profile: same for all 20 rows; each has a Replay `<a>` link; following it opens `/en/replay?deal=…`.
3. German: Alleinspieler / Gegenspieler, B/A/10, "12. Nov." — passed in all 8 German contexts.
4. Dark mode: screenshots `tmp/*-dark-*.png` looked at; tags, cards and numbers read clearly.
Mechanical defence (engineering.md Tools) passed on the final code: typecheck, build, 346 tests, client bundle, tokens,
literal grep, server bundle link, check:seo, test:seo.

## Deviations
- From the plan: the rows became a table on wider screens (the plan had two lines everywhere) — with two lines the front
  card showed 1½ games on desktop; the tag got its own column and an outline instead of a fill after the look-through
  review (a filled navy pill read as a button; tags zig-zagged after names of different lengths).
- The jack shows as "B" in English too: the site's card letter since SKATGO-76.

## Environment
web 55189, multiplayer 56189, database 57189 (container `skatgo-multiplayer-db-57189`). No env keys added, changed or
removed. Local DB holds a read-only copy of the owner's production records and those days' tournament decks.

## Residual
- On a phone (and up to 1023px) the front card's list is capped by `dims.xpListNarrow` (145px, shared with the XP board),
  so about two games show at a time, where five one-line rows showed before. Raising it is a token change (ui.md Redline 1).

## Check
1. Phone front card shows about two games at a time (was five); the cap is the XP board's shared height token.
2. Declarer / Defender tags: outlined, in their own column on desktop.
3. Desktop front card: one line a game, three in view.
4. Profile list on desktop: Replay is a link in its own column; on a phone it stays on its own line under the game.

## Decided for you
- Kept the difference to the AI at the right, uncoloured.
- Dropped the win/loss sentence and where it was played.
- Jacks, aces, tens in that order, by suit ♣♠♥♦ within each; a dash when none.
- One line a game where there is room, two on a phone.
- The front card's rows a step smaller than the profile's.
