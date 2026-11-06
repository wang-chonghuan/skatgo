# SKATGO-172 plan

## What the code says that the ticket does not

- Every deal a signed-in player plays against the AI is already on the server with the AI's result on the same cards
  in the same seat: the tournament's and the deal of the day's in `daily_entries.deals` against each day's
  `benchmark.summary`; free play's in `play_deals` (`mine`, `ai`), written when the result dialog asks for the review.
  `playProfile` reads them all this way; a guest's deal of the day moves to the account at sign-in (`/claim`).
- Days are the tournament's (`dayOf`, `DAILY_TIME_ZONE`); a week can be the Monday-to-Sunday of those days.
- The front page's Elo card (`elo-board.tsx`): `Panel fill`, title and a circled ? opening a `Modal`; under `bp.cards`
  folded behind one line whose names run sideways, opening to five rows and a half (`dims.eloListNarrow`); the list
  scrolls inside. Rendered on the server from `lib/elo-api.ts` (asked as nobody, cached a minute), `/api/daily/elo`
  in the browser.
- The result dialog (`DealResult`, SKATGO-166) shows `VsAiReview after`; the review brings `mine` and `ai` summaries.
  A replayed free deal (SKATGO-170) and a shared deal's practice are in no figure; lesson 11 has no review.
- The UI kit has no toast.

## Route

1. `app/src/lib/skat/xp.ts` (+ test): the tiers, a deal's XP from the difference, the week's Monday, the streak, the
   board's type — shared by the service and the page, as `elo.ts` was.
2. Service: `dailyXp(store, who)` in `daily.ts` replacing `dailyElo`: this week's deals of every account (aliases as one
   person), XP summed, streak from their deal days, names as on the boards, `you` for the asker; `POST /daily/xp`.
3. Web: `/api/daily/xp` (the asker if signed in), `lib/xp-api.ts` replacing `elo-api.ts`; the front page's loader.
4. `xp-board.tsx` replacing `elo-board.tsx`: the Elo card's frame, size and behaviour, with the mock's content.
5. After a deal: in the result dialog the deal's XP and why, and a toast with the calculation, once the review is in;
   a guest sees the sign-in line; nothing when replaying.
6. Elo removed: `elo.ts`, its test, `elo-board.tsx`, `elo-api.ts`, `/elo`, messages, token renamed; charter updated.
