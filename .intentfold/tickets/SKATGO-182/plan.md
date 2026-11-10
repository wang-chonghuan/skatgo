# SKATGO-182 plan

## What the code already promises, and what the ticket does not say

- Free play records nothing for a guest: `/api/free/review` names a player only when signed in, and the service's
  `/free/review` accepts only `user:` ids (`recordFreeDeal` into `play_deals`). The review is asked once per finished
  deal by the table itself (`server-table.tsx`), lesson 11's game included — so that is where a guest's deal can be kept.
- A guest already has an id for the deal of the day: `skatgo_daily`, an httpOnly device cookie (Path `/api/daily`,
  400 days), sent to the service as `anon:<sha256>`. Its daily entries are kept under that id for every day.
- Sign-in today moves only **today's** device entries to the account (`dailyClaim`, on `state`/`board`); past days
  never move (SKATGO-35). `player_aliases` (hand-written so far) already makes the XP board and the record of play
  count several ids as one person.
- `/api/daily/profile` answers a guest 401. The record of play lists no single deals since SKATGO-169
  (「Per day 这个不用显示」); the new request asks for a deal list at the top, folded for an account.
- The entry the human names, "My progress", is the front page's long card (SKATGO-135/172): for an account a link to
  `/profile` with its figures and curve; for a guest one line and a large `go` "Sign in".
- The privacy page says the device cookie is set only by the daily tournament and that a guest's free play is not
  stored; both change.

## Route

1. **One guest id for free play and the daily** — `app/src/lib/guest.ts`: the cookie (same name and value, so
   existing guests keep their id; Path widened to `/api`), its reading and its `anon:` hash. The daily handler uses it
   and re-sets a known cookie at the wider path; the free handler's `review` names the guest's `anon:` id, creating the
   cookie on the first accepted review. The service's `/free/review` accepts `anon:` as well as `user:`.
2. **Merge at sign-in** — `dailyClaim` keeps moving today's entries and also writes `player_aliases (anon → account)`,
   the account's own alias target if it has one, and repoints any row aliased to the anon id. The web claims on
   `state`, `board`, `xp` and `profile`, so the front page merges right after sign-in. Past boards keep their rows.
3. **The guest's record** — `/api/daily/profile` answers a guest with its device's deals (none without the cookie);
   the service gives an `anon:` id only its own deals and no weekly notes (never an account's record through an alias
   on a shared device). Daily deals carry their tournament's size so a row can say "Deal of the day" or the six deals.
4. **The deal list** — `deal-history.tsx`: one row per deal, newest first: what happened from the player's seat (the
   game declared or defended, won or lost, or all passed), the mode and the day in `meta`, the player's and the AI's
   Seeger-Fabian score with the `You`/`AI` tags as `VsAiTable` shows them; never `good`/`bad`. Long lists show a page
   at a time with a `quiet` "Show more".
5. **The page** (`profile-page.tsx`): under the H1 and lead, the list in a white card. An account: folded, its line
   "All your games (n)" with the chevron as "Earlier weeks" has, the rest of the page unchanged under it. A guest with
   deals: open, then the sign-in line and the `go` sign-in. A guest without deals: as today.
6. **The card** (`entry-page.tsx`): a guest with deals gets the account card's shape — the whole card a link to
   `/profile` — with the latest deals listed, scrolling inside as the XP board's list does, and one `slate` line that
   signing in keeps them. A guest without deals and every account: unchanged.
7. **Replay** (grill Q1, Q12–Q15): each row on the page has a replay control. `/replay?deal=<key>` plays it on
   a full-screen `GameTable` as `/daily/replay` does: a free deal through a new `/free/again` (the asker's own recorded
   deal, a `replay` token, so its review records nothing), a daily one through the practice routes, extended to a deal
   of the six (its day, size and number; only to a player whose entry has it finished). A guest's tap signs in first.
   Every deal in the record carries the key that names it.
8. **Words** — messages en/de; privacy text en/de; charter product.md / engineering.md / ui.md amended as the ticket
   says.
9. **Tests** — after the code: the service's claim, guest profile and guest review; the handlers' naming of the
   guest.

## Departures from the proposed solution

None in substance. The cookie keeps its old name (renaming would lose every existing guest's id) and only its path
widens.
