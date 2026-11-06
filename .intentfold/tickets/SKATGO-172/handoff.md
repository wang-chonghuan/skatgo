# SKATGO-172 handoff

## What changed

- **XP rules** — `app/src/lib/skat/xp.ts` (+ `xp.test.ts`): a deal's tier by its Seeger-Fabian difference to the AI's
  in the same seat on the same cards (≤ −50: 4, −49…−1: 6, 0 or no AI result: 10, 1…49: 14, ≥ 50: 20), the week's
  Monday, days to the reset, the streak; shared by the service and the page as `elo.ts` was.
- **Service** — `multiplayer/src/xp.ts` `weeklyXp`: this week's deals of every account — tournament and deal-of-the-day
  entries against each day's benchmark, free play's `play_deals` — summed per person (aliases as one), names as on the
  boards, the asker's row marked; `POST /daily/xp` replaces `/daily/elo`. Test `multiplayer/test/xp.test.ts`.
- **Web** — `/api/daily/xp` (the signed-in player, or nobody), `lib/xp-api.ts` replaces `elo-api.ts`; the front page's
  loader.
- **Card** — `xp-board.tsx` replaces `elo-board.tsx` with the same frame, size and folding: title, circled ? opening
  "How XP works" (`XpHow`: line, tier table, week line), one slate line "Every deal earns XP · starts again in n days",
  rows rank · name · 🔥 streak · XP, own row on `goodSoft` with "You"; the list scrolls inside; under `bp.cards` folded
  behind the running names line. Token `dims.eloListNarrow` renamed `xpListNarrow` (value unchanged).
- **After a deal** — `xp-earned.tsx` `XpEarned` in the result dialog's review (not for a replayed deal): "+6 XP · Below
  the AI by 40 ?"; a toast once at the top, one line, "+6 XP  1–49 below the AI = 6 XP", gone after 5 s or a tap; a
  guest: "Sign in to earn XP and join this week's board".
- **Elo removed** — `elo.ts`, `elo.test.ts`, `elo-board.tsx`, `elo-api.ts`, `dailyElo`, the `/elo` route and op, the
  `elo_*` messages, comments. Charter: product.md, engineering.md, ui.md rewritten for XP.

## AC results

1. **XP after a deal** — pass. Signed in (`test_konanekane`), a free deal: line "+6 XP / Below the AI by 40" (player 0,
   AI +40), toast "+6 XP 1–49 below the AI = 6 XP" at 27–304 × 8–48 px (dialog from 60, way out from 323); the board
   went 44 → 50. Guest reload of the same deal: "Sign in to earn XP and join this week’s board" (`data-guest`). The deal
   of the day uses the same dialog and review (code path), not played in the browser.
2. **Card** — pass. 1280×820: the card where the Elo card was, 522×209, the same as the progress card beside it; three
   rows unscrolled (list 89/89); "You" on the own row; ? opens the tier table. 375×812: folded 60 px with the running
   names, opened to the rows. Screenshots `tmp/desktop-board.jpg`, `tmp/desktop-how.jpg`, `tmp/phone-board.jpg`,
   `tmp/phone-deal-xp.jpg`.
3. **Weekly sums** — pass. `xp.test.ts` (tiers at their edges, Monday, reset, streak) and `multiplayer/test/xp.test.ts`
   (this week only, aliases as one, guests and last week off the board, the asker marked, Monday empty); seeded local
   board equals the hand sums (44 = 20 + 14 + 10, 14 = 4 + 10).
4. **No Elo** — pass. `git grep` for Elo in app/multiplayer sources and messages: none; `/api/daily/elo` 404.
5. **German** — pass. `/de`: "XP dieser Woche", "Jedes Spiel bringt XP · neu in 3 Tagen".

Mechanical defence passed (341 tests, SEO OK); multiplayer check 47/47.

## Deviations

- The tier table opens from the circled ? in a `Modal`, as the Elo card's explanation did, not as an expandable
  section as in the mock: the human asked for the Elo card's behaviour.
- After the human-eyes look: the toast is one line with the rule that applied (not the dialog line again), above the
  dialog and left of the way out; a gap before "You".

## Environment

Ports: web 55172, multiplayer 56172, database 57172 (Colima profile `skatgo`). No env keys changed. Local deals seeded
for `test_konanekane`, `test_olena`, `test_wolf`.

## Residual

None.

## Check

1. The front page's XP card on the computer and on a phone, and its ? dialog.
2. A deal's result: the "+N XP" line and the toast's wording ("1–49 below the AI = 6 XP").
3. The guest's line after a deal.

## Decided for you

- A deal without the AI's result counts as the same (10 XP); a replayed deal earns none.
- The week is Monday to Sunday by the tournament's days (Berlin time); streak = days in a row up to today or yesterday.
- The card lists every account with XP this week; the AI has no row.
- A guest is told "Sign in to earn XP" (a guest's free deal is not kept, so "keep" would not be true).
- The toast stays 5 seconds; the deal's XP also stays in the result under the score's calculation.
