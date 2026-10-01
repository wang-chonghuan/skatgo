# SKATGO-36 grill

Mode: `Grill: human` when the batch was written; the human then authorized self-adjudication for this
ticket (2026-10-01, 「回答36的grill问题」; the ticket's Grill row is now `self`). Answers below are recorded
by the pm session under that authority, from the Charter and observation; a Redline approval stays the
human's. Reviewed: live SKATGO-36 (amended 2026-10-01: guests join by nickname),
SKATGO-35's merged code (`multiplayer/src/daily.ts`, `app/src/lib/daily-handler.ts`,
`app/src/components/skat/daily-table.tsx`, `daily-page.tsx`), `ui.tsx`, the Charter.

## Batch 1 (2026-10-01)

### Q1. Production schema (operations.md Redline 5)

`daily_entries` gains a `nickname` column (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`, run by
multiplayer's `migrate()` on start, at deploy time only). Nothing else in production changes: no
env key, no resource.

- **Recommended**: approve.
- **Decision** (the human, 2026-10-01, asked by the pm session): **approved** — `daily_entries` gains
  `nickname` in production via multiplayer's `migrate()` (`ADD COLUMN IF NOT EXISTS`) at deploy, after
  the human says to merge and deploy. Recorded as a ticket comment.

### Q2. Can a nickname be changed, and is it unique?

- **Recommended**: the player may change today's nickname until midnight; a past day's stays as it
  was. Duplicates are allowed — a guest has no account to own a name, and uniqueness would let the
  first player "take" a name from everyone else. Rows are told apart by rank and highlight.
- **Decision** (pm, self-adjudicated): **accepted** — today's nickname may be changed until midnight; a
  past day's is frozen; duplicates allowed. Basis: guests have no account to own a name (the ticket puts
  guests on the board), so uniqueness would only let the first comer take a name.

### Q3. What counts as a valid nickname

- **Recommended**: trimmed, inner whitespace collapsed, 2–20 characters (counted as user-perceived
  characters), letters/numbers/spaces and `- _ . '` in any script; no control characters, no `@`
  (keeps e-mail addresses off the board), no URLs. **No profanity filter** in this ticket: a word list
  is easy to evade and has no moderation behind it; if needed, a later ticket with a way to remove a
  name.
- **Alternative**: a small built-in word list (de/en), at the cost of false positives.
- **Decision** (pm, self-adjudicated): **character rules accepted; the "no filter" part is not.**
  `product.md` says the learners are aged 6 to 99, and the board is public without sign-in (Q5).
  - Add a **small built-in block list** (de + en: the most common obscenities and slurs). Match it on
    whole words after case- and accent-folding, so false positives stay rare.
  - A refused name gets a plain "Please choose another nickname", never the matched word.
  - Add one line to `operations.md` Tools on how the operator clears a nickname on a given day. The
    entry stays and leaves the board until the player names it again. This is covered by the human's
    「授权你改charter」 for the tournament.
  - A moderation UI is out of scope.

### Q4. Ranking details

- **Recommended**: standard competition ranking — equal totals share a rank and the next rank skips
  (1, 1, 3). "Would be #n" for an unnamed finisher = 1 + the number of named entries with a higher
  total. The board shows the **top 100** and, if the player is below, their own row after a gap.
- **Decision** (pm, self-adjudicated): **accepted** — competition ranking (1, 1, 3); "would be #n" = 1
  + named entries with a higher total; top 100 plus the player's own row after a gap.

### Q5. Who sees the board, and which days

- **Recommended**: everyone, signed in or not, played or not — it shows only nicknames and totals.
  Two views: **today** (live) and **yesterday** (final). No older days in this ticket.
- **Why**: the ticket asks for today and the previous day; 37 is what restricts *deal-by-deal* detail
  to finishers.
- **Decision** (pm, self-adjudicated): **accepted** — everyone sees today (live) and yesterday (final);
  only nicknames, ranks and totals. Basis: the ticket's Scope names today and the previous day; deal
  detail stays 37's, for finishers only.

### Q6. The UI, including the first text field in the kit

- **Where**: on `/daily` under the start/continue/result block: a panel "Leaderboard" with a two-way
  switch "Today / Yesterday" (the existing toggle look), then rows: rank, nickname, total; the
  player's own row in the "chosen tile" colours (`brassSoft`-style fill per ui.md). Empty: "No one on
  today's board yet."
- **Nickname form** (only for a finished player, inside the result panel): label "Your nickname for
  the leaderboard", a native text input, and a primary button "Join the leaderboard"; prefilled with
  the nickname the player used on an earlier day. After joining: "On the board as <name> · change".
  Unnamed finisher: "Your total: X — that would be #n today."
- **The input** is a native `<input>` styled only from existing tokens: the chat input's border width
  (`border.hair`), the tile radius, the page's text colours and the `control` typography role, with
  the brass focus ring. **No new token.** If the existing tokens cannot make it look right, that is a
  stop and a question, not an inline value.
- **Decision** (pm, self-adjudicated): **accepted**. A native `<input>` styled only from tokens ui.md
  already names for the chat input (`border.hair`, the `tile` radius, the brass focus ring) and the
  `control` role. The player's own row uses the chosen-tile fill (`brassSoft`). Built for 1280 and 375
  widths. No new token; a missing one is a stop and a question (ui.md Redline 1).

### Q7. What "no new browser storage" is checked against

Clerk and the analytics already keep their own cookies/storage on every page today, before this
ticket.

- **Recommended**: AC4 compares against a baseline visit to `/daily` on the same build: the guest's
  whole flow may add only `skatgo_daily`. Clerk's and analytics' existing storage is out of scope.
- **Decision** (pm, self-adjudicated): **accepted** — AC4 is measured against a baseline `/daily` visit
  on the same build: the guest's flow may add only `skatgo_daily`. Clerk's existing cookies and the
  analytics' `localStorage` predate this ticket and are out of scope. The human deferred the analytics
  question to a later ticket (2026-10-01).

## Outcome

All seven resolved (Q1 by the human, Q2–Q7 self-adjudicated under the human's authorization). Fold
into `plan.md` / `ac.md`:
- **Q3**: the de/en block list (whole words, case- and accent-folded, a neutral refusal message), and
  the `operations.md` line on clearing a nickname. Add a check that a listed word is refused and an
  ordinary name containing it as a substring is accepted.

