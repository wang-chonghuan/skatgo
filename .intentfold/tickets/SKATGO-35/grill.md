# SKATGO-35 grill

Mode: `Grill: human` when the batch was written; the human then authorized self-adjudication for this
ticket (2026-10-01, 「你去回答工单35的grill问题」; the ticket's Grill row is now `self`). Answers below are
recorded by the pm session under that authority, from the Charter and observation; a Redline approval
stays the human's. Reviewed: the live ticket SKATGO-35 (and SKATGO-36/37 for what they will need
from it), `plan.md`, `ac.md`, the four Charter files, `multiplayer/src/*`, `app/src/server.ts`,
`app/src/lib/ask/handler.ts`, `app/src/lib/skat/{game,cards,value,ai,hints,table-view}.ts`,
`app/src/components/skat/{game-table,daily-page,client-part,pages}.tsx`, `app/src/lib/daily.ts`;
production inventory read-only (`render services`).

## Batch 1 (2026-10-01)

### Q1. Production approvals the route needs (operations.md Redline 5)

The route needs, **at deploy time** (this ticket is `Finish: review`, so nothing touches production
in this ticket):

- (a) **Production schema**: two new tables in `skatgo-multiplayer-db` — `daily_deals` and
  `daily_entries` — created by the multiplayer service's existing `migrate()` on start.
- (b) **Web service env**: `skatgo` gains `MULTIPLAYER_URL` (the multiplayer service's own Render
  hostname) and `MULTIPLAYER_ADMISSION_KEY` (the **same value** the multiplayer service already has —
  the web becomes its integration client; no new secret is minted).

No new cloud resources: the multiplayer service and its database already exist.

- **Recommended**: approve both.
- **Why**: they are the minimum for a server-owned tournament; any alternative needs more (Q2).
- **Decision** (the human, 2026-10-01, asked by the pm session): **approved both** — (a) the two new
  tables in production `skatgo-multiplayer-db`, created by multiplayer's `migrate()` on start; (b)
  `MULTIPLAYER_URL` and `MULTIPLAYER_ADMISSION_KEY` (the multiplayer service's existing value) on the
  `skatgo` web service. Both take effect only at deploy, after the human says to merge and deploy.
  Recorded as a ticket comment.

### Q2. Where the tournament runs

- **Recommended**: in `multiplayer/` as plain HTTP endpoints (`/daily/state`, `/daily/act`,
  `/daily/claim`) next to its health checks, using its PostgreSQL; the browser reaches them only
  through the web service at `/api/daily/*`, which adds the identity (Clerk session or anonymous
  cookie) and the admission key. Not a Colyseus room — one human and two deterministic computers need
  no socket; each move's answer carries the computers' replies.
- **Why**: reuses the engine adapter, crypto shuffle, store and redaction pattern already there; no
  dependency changes; cookies stay first-party on skatgo.com.
- **Rejected**: (i) web talks to PostgreSQL itself — needs `pg` in `app/` (Redline 3) and
  `DATABASE_URL` on web, two writers to one DB; (ii) browser calls multiplayer directly — needs Clerk
  verification inside multiplayer (new dependency + Clerk secrets there) and a cross-site cookie.
- **Decision** (pm, self-adjudicated): **accepted** as recommended. Basis: engineering.md Redline 3 (a
  `pg` dependency in `app/` would need approval; the proxy needs none); engineering.md *Stack* already
  gives `multiplayer/` the server-owned game and PostgreSQL, and *Structure* ("neither project imports
  the other's runtime") holds over HTTP. Observed: `multiplayer/src` has `Store.migrate()`,
  `secureDeck()` and the admission key check; `skatgo-multiplayer` and `skatgo-multiplayer-db` are live
  (`render services`, read-only, 2026-10-01). Condition: the `player` id is formed only by the web
  proxy, and `/daily/*` refuses any request without the admission key.

### Q3. Hints and the assistant during the tournament

The table's hint buttons ask the rules engine for the best move; the assistant reads the table and
quotes that hint.

- **Recommended**: in the tournament, **no hint buttons**, and the table is **not** shown to the
  assistant (it still answers rules questions). Free play and lessons keep both.
- **Why**: a ranked day where the engine can play every card for you measures nothing; SKATGO-36 ranks
  these scores.
- **Alternative**: keep hints for everyone (equal for all, more beginner-friendly), at the cost of a
  meaningless ranking.
- **Decision** (pm, self-adjudicated): **accepted** — no hint buttons in the tournament (the play hint
  tab and the drawer/panel hint buttons alike), and the tournament table is not published to the
  assistant. Basis: the ticket ranks these scores (SKATGO-36); a hint is the engine's best move, so a
  hinted day measures nothing. Free play and lessons keep both (ticket constraint: their behavior is
  unchanged).

### Q4. Dealer and seat across the 12 deals

The player is always seat 0 ("you"), as on `/play`. Who deals decides who is forehand.

- **Recommended**: the dealer **rotates** as at a real table (deal 1 dealer is random for the day,
  then clockwise), so over 12 deals the player is forehand, middlehand and rearhand 4 times each.
- **Why**: fair and familiar; a random dealer per deal can give one day 8 forehands.
- **Decision** (pm, self-adjudicated): **accepted** — the day's first dealer is random and stored with the
  deals, then the deal rotates clockwise; 4 deals in each seat role. Satisfies AC1 (same dealer and
  seat for everyone).

### Q5. The day ends at Berlin midnight, also for an unfinished entry

- **Recommended**: an entry not finished by midnight **stays unfinished** — its finished deals keep
  their scores, it cannot be continued, and it is not ranked (SKATGO-36). The next visit gets the new
  day's deals. A move sent for yesterday after midnight is refused and the page says the new deals are
  ready.
- **Why**: otherwise yesterday's deals would be playable while finished players may already see them
  compared (SKATGO-37).
- **Decision** (pm, self-adjudicated): **accepted**. No special handling for a start shortly before
  midnight: the `/daily` countdown already shows the time left.

### Q6. "Once a day" for players who are not signed in

Without an account, the player is an anonymous cookie on this device. Another browser or cleared
cookies is a new anonymous player who can play the day again.

- **Recommended**: accept that. Ranking needs sign-in (SKATGO-36), and a signed-in account plays once
  a day whatever the device.
- **Why**: stronger limits for anonymous players (IP, fingerprinting) are unreliable and intrusive.
  The cookie is strictly necessary to provide the game, so no consent banner is needed for it.
- **Decision** (pm, self-adjudicated): **accepted**. Basis: the ticket's constraint (play without an
  account; ranking needs sign-in). The cookie is httpOnly, first-party, strictly necessary, and is never
  passed to analytics.

### Q7. Signing in after playing anonymously (claim)

- **Recommended**: when a signed-in request arrives with an anonymous cookie that has today's entry:
  if the account has **no** entry today, the entry **moves** to the account (finished or not); if the
  account already has one, the account's stays and the anonymous one is left as it is. Done in this
  ticket, because identity is this ticket's (SKATGO-36 AC2 relies on it).
- **Decision** (pm, self-adjudicated): **accepted, for the current day only**: a past day's anonymous
  entry never moves, so a day's final ranking cannot change after midnight (SKATGO-36 AC3).

### Q8. The tournament's UI

- **`/daily`** keeps its server-rendered intro (title, date, countdown). Its button becomes, by state:
  "Play today's deals" (none started) / "Continue — deal n of 12" / for a finished day, a **summary**
  in place of the button: 12 rows (deal number, contract and declarer, the deal's Seeger-Fabian
  score) and the total, with "next deals in …".
- **Playing** opens the same **full-screen table** as `/play`, on the `/daily` page, browser-only.
  The panel's strip shows "Deal n of 12 · total so far".
- **After each deal** the settlement dialog adds "This deal: +X (Seeger-Fabian)" and its button
  becomes "Next deal" (deal 12: "See today's result"). A passed-in deal says it scores 0 and offers
  "Next deal" — there is **no redeal**.
- Leaving mid-deal is the existing leave button; coming back continues.
- Built from the existing kit and tokens; a missing token is a stop, not an inline value.
- **Decision** (pm, self-adjudicated): **accepted with three amendments**:
  - Q3 applies: no hint tab or hint buttons on the tournament table.
  - In the tournament, the panel's leave link returns to `/daily`, not the front page.
  - The table keeps SKATGO-34's stage layout and pinned panel unchanged.
  Strings in `en` and `de`. A missing token is a stop (ui.md Redline 1).

### Q9. Charter edits (authorized on the ticket) — the wording

- **`product.md`**, in *What this product is*, add after the course paragraph:
  > A daily Skat tournament at `/daily`: every day the same 12 deals for every player, each played
  > against two computer players and scored by Seeger-Fabian; one entry per player per day; scores are
  > the server's, from the cards actually played.

  and replace the non-goal *"It is only the course…"* with:
  > It is the course and the daily tournament. When it was split from Parrottoon the instruction was
  > 「只要课程」: none of Parrottoon's English content, and no link back to Parrottoon. The daily
  > tournament was added by the human on 2026-10-01 (SKATGO-35).

- **`engineering.md`**: in *Stack*, the web's `/api/daily/*` proxy and the tournament in
  `multiplayer/`; in *Structure*, the new paths; in *Key decisions*, "the tournament's cards and
  scores are the server's: the browser receives only seat 0's view; a deal is its deck + the human's
  actions, replayed through the engine"; in *Complexity hotspots*, that changing `ai.ts`/`game.ts`
  changes how stored past days replay (stored scores stay as written).
- **`operations.md`** — not in the ticket's authorization, but two lines become false: the web's
  "exactly" env list, and "No frontend admission flow is shipped yet". **Recommended**: authorize
  updating those tournament lines too (env list, runtime paragraph, local run of the pair).
- **Decision** (pm, self-adjudicated): **accepted**, with the scope of the authorization corrected. The
  human's words were 「授权你改charter」 (chat, 2026-10-01), which is wider than the ticket's restatement.
  - `product.md` and `engineering.md` as worded above.
  - `operations.md` **is authorized**, for the tournament's lines only: the web's env list, the runtime
    paragraph, the local run of web + multiplayer, and the deploy order (multiplayer before web).
  - Not touched in this ticket, only reported: the "Chinese, English and German" drift in
    `product.md`, and the stale registry names in `ui.md`.

### Q10. How acceptance checks it

- **Recommended**: as `ac.md` says — whole deals are driven **through the API**, headless, in
  seconds; the browser only checks that the page opens, the table deals and takes one move, a reload
  resumes, and the summary renders. "After Berlin midnight" is checked by restarting the **local**
  multiplayer with an acceptance-only clock shift kept in the ticket's `tmp/`, not a switch in
  product code.
- **Why**: your rule that acceptance does not play games; the API answers instantly, so the 12-deal
  criteria still get real evidence.
- **Decision** (pm, self-adjudicated): **accepted with limits**. The human's rule (2026-09-21) is that
  acceptance does not play games; its reason was 70+ minutes of bot-speed play.
  - The API run must stay **seconds**: the whole check finishes in under a minute.
  - **No deal is played in the browser.** The browser only checks open, deal, one move, reload and
    summary.
  - `handoff.md` lists the tournament's gameplay as left to the human's own testing.
  - The clock shift stays in `tmp/`, not product code.
  AC1, AC2 and AC4 cannot be decided without whole deals, and through the API they cost seconds.

## Outcome

All ten questions are resolved (Q1 by the human, Q2–Q10 self-adjudicated under the human's
authorization). Fold into `plan.md` / `ac.md`:
- Q3/Q8: no hints and no assistant snapshot on the tournament table, and leave returns to `/daily`.
- Q7: claims cover the current day only.
- Q9: `operations.md`'s tournament lines are in scope.
- Q10: the API check must run in under a minute.

