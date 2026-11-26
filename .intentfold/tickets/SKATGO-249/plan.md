# SKATGO-249 plan

What the code already promises: challenge tokens carry kind and n; /review returns `mine` and `ai` summaries with `won`;
the ladder (multiplayer/src/ladder.ts, app/src/lib/skat/tricks/ladder-progress.ts) is the record pattern; account
deletion clears the tables in forget.ts `OWN`. Undecided: nothing.

1. Multiplayer: table `challenge_passes (player, kind, n, passed_at)`; `/challenge/review` adds `passed` and, when the web
   names a player, records a pass (a failed write is logged, the review still answers); `/challenge-record/state` and
   `/merge` answer `{ passed: { kind: n[] } }`. forget.ts drops the table's rows.
2. Web handler: `/api/challenge/review` names the signed-in player; `/api/challenge/progress` and `/merge` need a session.
3. Browser: `lib/skat/challenge-progress.ts` (guest localStorage, account from the service, merge once signed in);
   the list card shows "Passed X / 30" and a ProgressBar and links to the first deal not passed; the play page marks a pass
   after the review.
4. Messages EN/DE; charter product/ui/engineering lines; tests for the pass rule and the record.
