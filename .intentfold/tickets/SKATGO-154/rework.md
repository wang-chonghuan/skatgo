# SKATGO-154 rework

Two rounds after the handoff. Each was committed once, with the human's ask as the commit's first line.

1. 「扩充到600道呗，既然都594合格了」
   - The run now has 600 questions: 200 passes and 400 bids drawn from the 594 SkatZero-confirmed ones, still easy to hard.
   - Each bid question still records its `sure`, and the generator is unchanged apart from the count.
   - Rechecked:
     - unit tests and the multiplayer bidding tests, including SkatZero recomputing a sample;
     - SKATGO-151's acceptance script, 10/10, after pointing its played-question step at the first question the AI plays, since question 1 is now a pass.
   - A local multiplayer built before the regeneration refused the new question ids. After a rebuild it accepted them. A deploy builds both services.
2. 「这些令人费解，你最好简化」 / 「问题是item太多了，名字莫名其妙，百分比倒没啥」
   - The stats card has three rows, one per outcome of the two steps: "Right", "Wrong contract" (step 1) and "Wrong bid" (step 2).
   - The percentages add up to 100% by largest remainder.
   - The four kind rows ("Passed, should have played" …) and "Wrong" are gone, with their messages.
   - An intermediate version with counts was replaced within the round, before the human saw it.
   - Rechecked: AC5 (three rows, matching, adding up) and AC7; the script passes 10/10.

Net effect against the frozen handoff:
- 600 questions instead of 300.
- The stats card shows three rows.

The SkatZero check, the tests and the explanation are unchanged.

Synchronized with main (SKATGO-155) by a clean rebase with no overlapping regions; the mechanical defence and the multiplayer check were run once on the combined branch.
