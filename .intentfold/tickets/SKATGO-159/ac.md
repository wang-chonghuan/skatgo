# SKATGO-159 acceptance checks

1. **Fewer than 200 questions** — count `PRACTICE_QUESTIONS` (vitest) and the page's "1/N" on the running product.
2. **Routine questions ≤ ¼ and first** — vitest: questions the routine answers right in both steps are ≤ 25% of all
   and form a prefix of the run.
3. **Every other question beats the routine in a step** — vitest: for each question after that prefix the routine's
   contract or bid differs from the answer.
4. **"How far" questions** — vitest: some questions' answer bid differs from the contract's ten-card value; on the
   running product such a question's explanation, after answering, names the chance at each offered bid.
5. **SkatZero's own play** — multiplayer test: every question is its pool seat with SkatZero's highest bid, every bid
   question's contract has `sure ≥ 0.6`, and a sample recomputed by SkatZero gives the recorded share and chances.
6. **Old records gone** — on the running product with a browser holding v1 keys and an account with old rows: the
   practice opens at 1/N, no stats card, no red numbers; the old rows are gone from the database after the
   service starts.
