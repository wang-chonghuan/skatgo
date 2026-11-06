# SKATGO-174 handoff

## What changed
- **The week line** in "How XP works" (`xp_how_week`, `app/messages/en.json` / `de.json`, only this key): the streak
  carries on, only XP starts at 0 on Monday. EN "🔥 days in a row with at least one deal. Signed-in players only; XP
  starts at 0 every Monday, the streak carries on." DE "… die XP beginnen jeden Montag bei 0, die Serie läuft weiter."
- **The board follows the deals live** (`app/src/components/skat/xp-board.tsx`): besides the read on mount, it asks
  `/api/daily/xp` again every 15 s while the page is in view and at once when the page comes back into view; a hidden
  page does not ask. The service is unchanged — it already computes the board from the rows on every request, and
  each deal is written when it ends.
- Charter: engineering.md's XP paragraph says so.

## AC results
1. **Week line** — built app, desktop 1280×820 and phone 375×812, EN (`/en`) and DE (`/`): the modal's 🔥 line reads
   as above in all four (`tmp/ac-week.mjs`; screenshots `tmp/desktop-how.jpg`, `tmp/phone-how.jpg`). Pass.
2. **Live without reload** — `/en` open, a free-play deal for another account ("Kiebitz") written into the local DB as
   the service writes it: the row appeared after 13.9 s without reload, XP 16 (20 above the AI, declared: 14 + 2),
   🔥 1 (`tmp/ac.mjs`, `tmp/desktop-live.jpg`). Pass.
3. **Back into view** — page hidden: 0 board requests in 17 s while another deal was added; shown again: the board
   showed the new 26 XP 39 ms later. Pass. The test rows were deleted afterwards.
- Mechanical defence: pass (typecheck, build, 342 tests, client bundle, design tokens, no raw styles, server bundle
  links, SEO built check and its tests).

## Deviations
- The week line was shortened after the look through the human's eyes (the plan's first wording put "the streak
  carries on from week to week" in the first sentence; now the contrast sits beside the Monday reset).

## Environment
- Ports: web 55174, multiplayer 56174, database 57174.
- Env keys added, changed or removed: none. (The worktree's own `app/.env` points `MULTIPLAYER_URL` at 56174 for the
  review only; not a key change.)
- Local DB: production's board rows of the last 40 days for this week's players, all aliases, and the owner's own
  records (`tmp/week-board.sh`, `tmp/demo-me.sh`, read-only on production) — the local board equals production's.

## Residual
- None.

## Check
1. http://localhost:55174/en — the week line under the XP board's question mark.
2. http://localhost:55174/en — leave it open, play a deal in another tab (signed in); the board follows without reload.

## Decided for you
- Every 15 s while the page is in view, at once on coming back into view, nothing while hidden; no push channel.
- Only the week line changed, EN and DE; shortened so the contrast sits beside the Monday reset.
- The server render keeps its minute's cache; the browser asks again on load.
