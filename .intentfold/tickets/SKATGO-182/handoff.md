# SKATGO-182 handoff — guest games kept, merged at sign-in; history and replay

## What changed

- **A guest's id for all of `/api`** — `app/src/lib/guest.ts` (new): the `skatgo_daily` device cookie (same name and
  value, so every existing guest keeps their id), now with Path `/api`, its `anon:<sha256>`. `daily-handler.ts` uses it
  and sets a known cookie again at the wider path; `free-handler.ts` names the guest's device on `review` (creating the
  cookie on the first kept game) and adds `again` (account only, 401 for a guest).
- **Guest games kept** — `multiplayer/src/free.ts`: `/free/review` accepts an `anon:` player, so a guest's finished
  free deal (lesson 11's game too) goes into `play_deals` under the device. Deals of the day were already kept.
- **Merge at sign-in** — `multiplayer/src/daily.ts` `dailyClaim`: besides moving today's entries, it writes
  `player_aliases (device → the account's person)` once and repoints ids that were the device's person. The web claims
  on `state`, `board`, `xp` and `profile`, so the front page merges at once. Past boards keep their rows.
- **A device's own record** — `multiplayer/src/profile.ts`: `idsOf` (shared); an `anon:` id gets only its own games and
  no notes; every deal carries its `key` (`play_deals.game`, or `daily:<day>:<size>:<deal>`). `/api/daily/profile`
  answers a guest with its device's games (none without a cookie).
- **Replay** — `POST /free/again` (the asker's own recorded free deal, dealt anew under a `replay` token, recorded
  nowhere); `/share/practice/new` takes `size` and `deal` for a tournament's deal (only for an account whose entry has
  played it), the practice token carrying them. Page `/replay?deal=<key>` (`routes/replay.tsx`, `RecordReplayPage` in
  `shared-page.tsx`): the full-screen table as `/daily/replay`, "Replay this deal" again, close back to the profile;
  free deals with free play's power-ups. Registered as private (`indexability.ts`, `sitemap.ts`) and a table frame.
- **History** — `components/skat/deal-history.tsx` (new): the record's rows in the columns of "You vs. the AI"
  (`dims.versusColumns`), `You`/`AI` tags once; what happened in the result's words, mode and day, a "Replay" link under
  them; and the front page's one-line rows. `profile-page.tsx`: "Your games (n)" at the top — folded for an account,
  open for a guest with the sign-in under it; 20 rows then "Show more"; a guest's replay opens Clerk and goes on once
  signed in. `entry-page.tsx`: a guest who has played gets the games on the My progress card, the sign-in beside its
  title, the games the link to the record; a guest who has not, and every account, as before.
- **Words** — `messages/{en,de}.json` (`history_*`); privacy text (`legal.ts`, en/de) on the cookie and kept games;
  `analytics.ts` `sign_in_clicked` place `history_replay`.
- **Charter** — product.md (guest games kept and merged; the history; replay needs an account), engineering.md (the
  record's keys and `/replay`, a guest's games, the claim, free review naming a device, the cookie), ui.md (the card, the
  history table, the replay page), as the ticket's Constraints say.
- **Tests** — `multiplayer/test/guest.test.ts` (new): kept under the device, merged once, joined to the account's
  person, past boards untouched, no guest on the XP board, a device's record its own. `profile.test.ts` and
  `app/src/lib/profile-handler.test.ts` brought to the new rules (keys; a device's own record; guests named by their
  device; `again` for an account only).

## AC results

Run on web 55182 / multiplayer 56182 / database 57182 with the owner's production records copied read-only (demo-me,
plus the past days' full deals) and seeded guest devices; `tmp/ac.mjs`, then `tmp/recheck.mjs` after the review round.

1. **Guest free deals count for a new account** — PASS. Device A's four games are the new account's record;
   `/api/daily/xp` shows it with 32 XP, 50 %; the device is one of its ids.
2. **A guest's past deal of the day counts** — PASS. `daily:2026-11-08:1:0` in the account's record; that day's board
   unchanged, the guest's row under "Gast A".
3. **An existing account keeps its deals** — PASS. 8 own + 2 device = 10, each once.
4. **Guests still play free and are not on the board** — PASS. `/en/play` deals with no sign-in; XP rows = account
   people (5), with an unmerged device holding 3 games; a guest's `/api/free/again` is 401.
5. **Guest card and page** — PASS, desktop and phone, `/en` and `/`: the card lists 4 games newest first, keeps its
   sign-in, the games link to the record; the record's history open with 4 rows, replay under each, and the sign-in;
   a device with no games sees the card's sign-in as before.
6. **Account card and page** — PASS. Card with its figures, no list; the record starts with "Your games (4)" folded,
   at the section titles' size, opening to every game; "You vs. the AI" and the curve under it.
7. **Replay** — PASS. From a row, `/en/replay?deal=…` opens the table; the free deal again has the recorded deal's
   dealer and the same ten cards (checked against the pool), a deal of the six likewise (against the day's deck);
   starting it leaves XP and the record unchanged; a deal not in the record is 409, a six-deal the account did not play
   409 `not_played`; signed out, replay opens Clerk's sign-in. Playing a replay to its end is left to the human's own
   testing.
8. **Layout** — PASS. No sideways scroll at 1280×820 and 375×812, en and de; no console errors.

Mechanical defence (engineering.md): typecheck, build, 346 app tests, client bundle, design tokens, literal check,
server bundle link, `check:seo --built`, `test:seo` — passed. `npm --prefix multiplayer` typecheck, build and 68 tests
passed (with the ticket's multiplayer stopped, which otherwise holds the database's leader lock).

## Deviations

- The entry is the front page's existing My progress card, not a new header link (ticket comment).
- Replay was added to the scope by the human's answer to grill Q1; `/replay` is a new private page rather than free
  play's `/play`, so its round and kept game stay as they were.
- The guest card keeps its sign-in button (beside the title) and only the games are the link — from the look review: the
  human asked for the sign-in in that card before (SKATGO-135).

## Environment

Ports: web 55182, multiplayer 56182, database 57182. No env key added, changed or removed (the worktree's
`multiplayer/.env` points at the ticket database locally; nothing to sync back).

## Residual

- A browser with the old daily cookie that finishes a free deal before it next opens a daily page gets a second device
  id for those deals until then; they stay out of its merge (grill Q2, accepted as rare).
- The record's "Last day … : → about the same" line called −201 against −4 "about the same" on a two-day record —
  existing trend wording (SKATGO-128/169), not touched here.

## Check

1. The My progress card for a guest who has played: the list with "Sign in" beside the title.
2. The history at the top of the profile: the table with You / AI, "Replay" under each game; folded when signed in.
3. Replay from a row: the same cards again, counted nowhere.

## Decided for you

- The guest id is the deal of the day's device cookie, widened to all of `/api`, not a new cookie.
- The merge is an alias from the device to the account, written at sign-in; past boards keep the guest's row.
- A device that went to one account stays with it; a second account signing in there takes none of it.
- Signed out on a device, only that device's games show — never the account's record or weekly notes.
- The guest card keeps its sign-in button beside the title; the games, not the whole card, open the record.
- The history uses "You vs. the AI"'s columns; "Replay" is a link under each game; 20 rows, then "Show more".
- Replay plays on its own page `/replay`, so free play's round is untouched.
- A deal of today's six can be replayed only once the player has played it (it is in the history only then).
- The privacy page says what the cookie now keeps.
- The "you already have N XP, sign in" prompt was not built.
