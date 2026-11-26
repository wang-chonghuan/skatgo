# SKATGO-249 handoff — hard hands: each kind's progress

## What changed
- **Pass rule and record (multiplayer).** `src/challenge.ts`: `passedDeal` — won, or lost where SkatZero's run of the
  same cards lost too; `/challenge/review` answers `passed`, `kind`, `n` and, when the web names an account, records the
  pass (a failed write is logged and costs the pass, never the review); `challengeRecordRoutes` at `/challenge-record/state`
  and `/merge` (`server.ts`). Table `challenge_passes (player, kind, n, passed_at)` in `store.ts`, a pass never undone;
  `forget.ts` deletes it with the account.
- **Web handler.** `app/src/lib/challenge-handler.ts`: `/api/challenge/review` names the signed-in player; new
  `/api/challenge/progress` and `/merge`, sign-in only; a body naming a player is refused.
- **Browser.** `app/src/lib/skat/challenge-progress.ts` (guest localStorage `skatgo.hard-hands.v1`, account from the service,
  merged once signed in, as the Skat Tricks ladder); `kindProgress` in `lib/skat/challenge.ts`. `challenge-page.tsx`: each
  card's foot "X of 30 passed" (`meta`, slate) over the existing `ProgressBar`; the card links to the first deal not passed;
  the play page marks a guest's pass after the review. Messages `challenge_progress` EN/DE.
- **Charter.** product (the rule, kept per account / browser, roguelike put off), ui (the card's foot), engineering (where
  the record lives).
- **Tests.** multiplayer `challenge.test.ts` (pass rule; a deal played out in-process and reviewed for an account, the record
  agreeing; merge idempotent and bounded), `forget.test.ts` (the table goes with the account); app `challenge.test.ts`
  (`kindProgress`).

## AC results (web 55249, multiplayer 56249, DB 57249; Playwright headed, desktop 1280×820 and phone 375×812)
1. Five cards each "0 of 30 passed" with the bar at 0 for a fresh visitor — PASS both viewports; German "0 von 30 geschafft".
2. One more pass adds one and lengthens the bar — PASS: the account's record went from 3 to 4 for "Good hand in a bad seat",
   bar 10 → 13 %, the card then opening deal 5. The pass written by the review itself is proven by the multiplayer test
   (a real finished deal reviewed for an account; the record holds the deal exactly when the review says passed). Playing a
   deal to its end in the browser is left to the human's own testing.
3. Lost but SkatZero lost too → passed; lost and SkatZero won → not — PASS in the multiplayer test (`passedDeal`, and the
   review's `passed` matching `mine.won || !ai.won` on a finished deal).
4. A card with progress opens the first deal not passed — PASS: passes 1, 2, 4 → link n=3, the table shows "3 of 30"; Null
   with pass 1 → n=2; untouched → n=1.
5. Guest progress survives a reload; signed in it is the account's and seen from another browser — PASS with a local test
   account: the browser's record merged and then cleared from the browser, a second context on the same account shows it.
   Signed out, `/api/challenge/progress` and `/merge` answer 401; a request naming a player 400.
6. Account deletion removes the passes — PASS in `forget.test.ts`.

Mechanical defence: web (typecheck, build, 372 tests, client bundle, tokens, literal grep, SSR link, SEO built + tests)
and `npm --prefix multiplayer run check` (76 tests) against the ticket database — all pass.

## Deviations
None from `plan.md` / `draft.md`. `ChallengeProgress` and `kindProgress` live in `app/src/lib/skat/challenge.ts` (shared by
the service and the browser) rather than only in the browser's file.

## Environment
Ports web 55249, multiplayer 56249, database 57249. No env keys added, changed or removed. The production database gains
the table `challenge_passes` on the multiplayer service's next start (`CREATE TABLE IF NOT EXISTS`).

## Residual
- The roguelike run (floors, lives, perks) — put off by the human; its own ticket when wanted.
- Passes are kept by deal number; if the pool is ever regenerated, the numbers would point at new deals.

## Check
1. http://localhost:55249/en/hard-hands — how strong the progress reads. The fresh-eyes reviewer thought the count
   (`meta`, 13px) and the site's standard `ProgressBar` (thin, pale track) may read too faint — an empty card looks like
   a placeholder, and 1 of 30 is a dot. Left as the standard bar the League and the lessons use: a thicker bar or a larger
   count means a new or retuned token (ui.md Redline 1), which is yours to approve. Its other point, bars not in one place,
   is how equal-height cards place a bottom-pinned foot: every bar sits the same distance from its card's bottom.
2. Play one deal of any kind to its end, go back to http://localhost:55249/en/hard-hands — if you won (or the AI lost the
   same cards too), that card reads "1 of 30 passed" and its bar has a first segment; clicking it opens deal 2.
3. http://localhost:55249/en/hard-hands on a phone width — the count and bar at each card's foot.

## Decided for you
- Wording: "12 of 30 passed" / "12 von 30 geschafft", the Skat Tricks ladder's "12 of 30 solved" form.
- The count and bar sit at the foot of each card, under its description.
- A pass is never taken back by a later loss; "Same hand again" passing counts for that deal.
- When all 30 are passed, the card opens deal 1 again.
