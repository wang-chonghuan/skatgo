# SKATGO-128 plan

## Found in the code that the ticket does not say

- Only the daily tournament stores deals: `daily_entries.deals` holds each finished deal's summary
  (Seeger-Fabian per seat, [0] the player's), and `daily_deals.deals[i].benchmark.summary` the AI's play of
  the same deal from the player's seat. The difference per deal is computable for every stored day.
- Free play stores nothing per game (engineering.md: "The server keeps nothing per game", "`/free/review` …
  stores nothing"; product.md: free play "unranked, free and without an account"). Its AI game is worked out
  in `/free/review`, which the table asks for by itself when a deal ends (`server-table.tsx`, the score sheet
  and the round both read it). That is the one moment a free deal's own and AI scores are both known.
- `/api/free/*` names no one ("No identity, no cookie"); `/api/daily/*` names the Clerk account as `user:<id>`.
- `player_aliases` merges ids into one person (`same_as`) for the Elo; the profile should do the same.
- Lesson 11's game goes through the same `/free/review`; it is a real deal against the same AI and counts.
- A chart needs dimensions for SVG attributes, which the token check only accepts from `app/src/theme/`.
  `constants.ts` gets the chart's geometry: a registry change, authorised by the human's request for a curve.

## Route

1. **multiplayer storage** — `play_deals (player, game, day, at, score, ai)`, primary key (player, game), in
   `store.ts`'s migration. `game` is `free:<pool>:<deal id>:<start ms>`, so asking the review twice records once.
2. **recording** — `/free/review` takes an optional `player` (the web's to name); when given, after the review
   it inserts the deal: the player's Seeger-Fabian score and the AI's, the day by the tournament's `dayOf`.
3. **reading** — `POST /daily/profile` (`src/profile.ts`): the account and the ids `player_aliases` names as it;
   every tournament deal (entries of size 6, finished or not, with its day's benchmark) and every recorded free
   deal, in order: day, source, own score, AI score. The web's `/api/daily/profile` requires an account (401).
4. **web proxy** — `free-handler.ts` passes `player: user:<id>` on `review` when signed in, and refuses a
   browser-sent `player`. `daily-handler.ts` gets the `profile` op, account only.
5. **the page** — `/profile` (`/de/profil`, `/en/profile`), a sub-page on the grey page, noindex
   (`PRIVATE_PAGES`). H1 and one-line lead; a white card with the curve: one point per deal, own score minus
   the AI's, a zero line and a hairline at each new day, the largest values beside it; a white card with one
   row per day, newest first: the date, how many deals, and the day's sum against the AI. A guest sees a `go`
   sign-in button; no deals yet says so with a way to free play and the tournament.
6. **way in** — the settings, under the nickname: a link "Mein Skat-Profil".
7. **charter** — product.md (free play records a signed-in player's deals for the profile; the profile page),
   engineering.md (`play_deals`, `/free/review` records, `/daily/profile`), ui.md (the page), as the request
   requires.

## Slices

1. multiplayer: table, recording, `/daily/profile`, test against the local database.
2. web: proxies, api call, page, route, settings link, messages, tokens.
3. charter, then handoff.
