# SKATGO-36 handoff

## What changed

**Tournament server — `multiplayer/`**
- `src/store.ts`: `migrate()` adds `daily_entries.nickname` (`ADD COLUMN IF NOT EXISTS`).
- `src/daily.ts`:
  - `POST /daily/name {player, nickname}`: today only, finished entries only, until midnight
    (re-naming allowed). The name is judged by `cleanNickname`; a refusal is `nickname_refused` with no
    reason.
  - `POST /daily/board {player|null, day: today|yesterday}`: named finished entries by total, with
    competition ranks (1, 1, 3) and the top 100. It returns the asking player's own row apart (`own`)
    when it is below the top 100, their standing (`me`: finished, total, nickname, rank or the rank
    they would have), and the nickname they last used (`lastNickname`). No player id leaves the service.

**Shared — `app/src/lib/skat/`**
- `nickname.ts` (new): trim and collapse spaces, NFC; 2–20 user-perceived characters; letters and
  numbers of any script, space and `. _ ' -`; no `@`, no address-like `word.tld`. Plus a de/en block
  list matched on whole words after case and accent folding. Names that are also plain words or names
  are left out (Dick, Heil, Sieg).
- `tournament.ts`: the `BoardRow` / `DailyBoard` reply types.

**Web — `app/`**
- `lib/daily-handler.ts`: `/api/daily/name` and `/api/daily/board`. The board needs no player: a
  visitor nobody knows asks as nobody, and no cookie is ever set for looking. `name` needs a known
  player. A signed-in `board` request with a device cookie claims today's device entry, as `state`
  already did.
- `lib/daily-api.ts`: `dailyName`, `dailyBoard`.
- `components/skat/daily-table.tsx`:
  - `DailyEntry` now loads today's board too, and renders `Leaderboard` (Today / Yesterday switch;
    rows with rank, nickname, total; own row in the chosen-toggle fill; the player's own row apart
    below a gap; empty messages).
  - `DailyResult` gains the `Nickname` form. Unnamed: "Your total: X. That would be #n today", the
    label, a native text input (existing tokens only) and "Join the leaderboard", prefilled with the
    last nickname. Named: "On the board as X" and "Change". A refusal shows only "Please choose another
    nickname."
- Strings in `messages/en.json` and `de.json`.

**Charter** (authorized):
- `operations.md` Tools: the `render psql` command that clears a day's nickname. The entry stays and
  leaves the board.
- `engineering.md`: the nickname in the `daily_entries` description, and `nickname.ts` in Structure.

## AC results

Local stack: web 55036, multiplayer 56036, PostgreSQL 57036. Script `tmp/ac36.mjs`, headed. Whole days
were driven through each browser context's own `/api/daily` requests (0.7 s per day); no deal was
played in the page. A Clerk **dev** test account was used for the signed-in player.

1. **A guest and a signed-in player, ranked by total — PASS.**
   - Guest "Scunthorpe" and signed-in "Willi K" each finished the day and named themselves. Two seeded
     entries ("Tie One", "Tie Two") were added for a tie.
   - Both browsers show the same board, equal to `daily_entries` in order: `#1 Scunthorpe 120, #1 Willi
     K 120, #3 Tie One 55, #3 Tie Two 55`. Equal totals share a rank and the next rank skips.
   - In each browser only that player's own row is highlighted (`data-me`).
2. **Unnamed finisher; no real names — PASS.**
   - A finished guest without a nickname is not on the board, and sees "Your total: +120. That would be
     #1 today".
   - After naming, the row appears and is highlighted.
   - The board response and the page contain none of the test account's first name, last name or
     e-mail, no `user_` id, no `anon:` id and no `player` field.
3. **Yesterday's final ranking; today starts empty — PASS.**
   - The local multiplayer was restarted with the clock shifted past Berlin midnight. Today's board
     (`2026-10-02`) is empty.
   - "Yesterday" shows `2026-10-01`'s ranking exactly as it was.
4. **No consent banner, no new storage — PASS.**
   - A fresh guest went from a baseline `/daily` visit (reload included) to being on the board.
   - Added storage: cookies `["skatgo_daily"]`; `localStorage`, `sessionStorage` and IndexedDB nothing
     new. No banner or dialog.

Nickname filter (grill Q3) — PASS, through the page's form:
- Refused, each with only "Please choose another nickname." and nothing stored: `fück you`,
  `HURENSOHN`, `a@b.de`, `skatgo.com`, `A`, 21 characters.
- `  Scunthorpe  `, which contains a listed word only as a substring, is accepted and trimmed.

Phone 375×812: the board renders with the own row highlighted, and there is no horizontal scroll.
Screenshots of the form and the board at both sizes are in `tmp/`.

**Mechanical defence** (`engineering.md` Tools): PASS — typecheck, build, 75 tests, client bundle,
design tokens, literal grep, SSR link. `npm --prefix multiplayer run check`: 12/12 pass.

**Left to the human's own testing:** playing the day at the table (unchanged from SKATGO-35), and how
the board and the form feel.

## Deviations

- The own row's fill is the code's chosen-toggle colour (`color.goodSoft`); ui.md's `brassSoft` is
  one of its stale registry names.
- `engineering.md` got two small tournament lines beyond the operations line the grill named, so its
  description of `daily_entries` stays true.
- Below the top 100 the player's row comes back apart (`own`) instead of being appended to `rows`.
- Proposed solution followed: the ranking is computed from 35's rows and the nickname is stored with
  the day's entry. The open questions (duplicates allowed, the filter) were settled in the grill.

## Environment

- Ports: web **55036**, multiplayer **56036**, database **57036** (running for review).
- Env keys: **none** added, changed or removed in product configuration. The worktree's own
  `app/.env` points `MULTIPLAYER_URL` at 56036, and `multiplayer/.env` points at database 57036 with
  `DOCKER_CONTEXT=colima`. These values are ticket-local and are **not** synced back.
- Production at deploy: multiplayer's `migrate()` adds the `nickname` column (approved, grill Q1);
  then web. No env change.
- A Clerk **dev** test user was created for acceptance (`skatgo36+clerk_test@example.com`); its
  credentials are in `tmp/` only.

## Residual

- SKATGO-37 (review and comparison) can read the same rows; it should show nicknames only, as here.
- Nickname moderation beyond the operator's SQL line (a way for players to report a name) is not built.
