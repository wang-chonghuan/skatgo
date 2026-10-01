# SKATGO-36 plan

## What the code already says that the ticket does not

- SKATGO-35 left each player's day in `daily_entries (day, player, actions, deals, total, created_at,
  finished_at)` in the multiplayer service's PostgreSQL; `player` is `user:<Clerk id>` or
  `anon:<hash of the device cookie>`. A finished entry has `finished_at` and its Seeger-Fabian
  `total`. Nothing stores a name, and nothing ranks.
- The browser reaches the tournament only through the web's `/api/daily/{state,act}` proxy
  (`app/src/lib/daily-handler.ts`), which names the player; multiplayer's `/daily/*` routes are
  behind the admission key. The guest cookie is set only when a guest starts playing (35 rework), so
  a visitor who only looks has no player id.
- `/daily` (`daily-page.tsx`) renders the intro on the server and `DailyEntry` in the browser:
  start / continue / the day's result (`DailyResult`). The page is in the rail frame.
- The course kit (`ui.tsx`) has buttons, panels and pills but **no text input**; the only text field
  on the site is deep-chat's, inside the assistant.
- `dayOf()` in `multiplayer/src/daily.ts` gives the Berlin day; "yesterday" is the previous day.

## Route

1. **Storage** — `daily_entries` gains `nickname text` (NULL until the player joins the board), by
   `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in `Store.migrate()`. The ranking is computed from the
   rows on request, never stored. A claim (35) moves the row, so a nickname moves with it.
2. **Multiplayer** (`src/daily.ts`), behind the admission key like the rest:
   - `POST /daily/name {player, nickname}` — today only, finished entries only; trims, validates
     (grill Q3), stores. Allowed again the same day to change it.
   - `POST /daily/board {player | null, day: 'today' | 'yesterday'}` — rows of named, finished
     entries for that day ordered by total: competition rank (1, 1, 3), nickname, total, `me` for the
     asking player's row; plus the asker's own standing (`total`, `rank` as if on the board, `named`)
     and the last nickname they used on an earlier day (to prefill).
   - `state` replies unchanged.
3. **Web proxy** — `/api/daily/name` and `/api/daily/board` added to `daily-handler.ts`. Neither ever
   sets the cookie (a visitor without one asks `board` as nobody); `name` needs an existing player.
4. **Page** — on `/daily`, under the start/continue/result block, the leaderboard (today; a switch to
   yesterday's final ranking). After the 12 deals, the result block offers the nickname form; once
   named, the player's row on the board is highlighted. A finished player without a nickname sees
   their total and "would be #n".
5. **Nickname rules** (`app/src/lib/skat/nickname.ts`, pure, read by multiplayer): trim, collapse
   inner whitespace, 2–20 user-perceived characters, letters/numbers/spaces and `- _ . '` in any
   script, no `@`, no URL; plus a small de/en block list matched on whole words after case and accent
   folding. A refusal says only "Please choose another nickname".
6. Strings in `en` and `de`.
7. **Charter**: one `operations.md` Tools line on how the operator clears a day's nickname (set it
   to NULL; the row leaves the board until the player names it again).

## Grill outcome

Settled 2026-10-01 (`grill.md`): Q1 approved by the human (deploy time only); Q2, Q4–Q7 as
recommended; Q3 adds the block list and the operations line.

## Redline lookup

| Action | Entry | Result |
|---|---|---|
| `ALTER TABLE daily_entries ADD COLUMN nickname` on production at deploy | operations.md R5 "changing production schema" | **approval required** → grill Q1 |
| New env key / secret / dependency | operations.md R5, engineering.md R3 | none needed |
| A new kind of form control (text input) styled from existing tokens | ui.md R1 only if a token is missing | aim: no new token; a missing one is a stop → grill Q6 |
| New browser storage | ticket constraint | none: the nickname lives on the server |
| Acceptance against production | operations.md R2 | local stack only; signed-in check uses a Clerk **dev** account |

## Departures found while building

- The player's own row uses the chosen-toggle fill the code actually has (`color.goodSoft`); ui.md's
  `brassSoft` name is part of its stale registry names (reported in SKATGO-35).
- `engineering.md` also gained the nickname in its `daily_entries` sentence and `nickname.ts` in
  Structure, so the tournament's description stays true.
- Below the top 100 the player's own row comes back apart (`own`) rather than appended, so the page
  needs no inference to draw the gap.
- The block list leaves out words that are also names or plain words (Dick, Heil, Sieg).
