# SKATGO-150 acceptance checks

Web 55150, multiplayer 56150, local DB 57150, built. Signed-in checks with the local test account cookie.

1. Account answers persist: answer questions as a test account, reload, and from a fresh context with the same account
   the analysis shows the same counts. Plus multiplayer test: the record keeps the first answer, sets fixed on a later
   right one, refuses an answer not among the options.
2. Mistake book: a wrong answer adds its question number under the analysis; clicking it shows that question again;
   answering it right removes it.
3. Analysis: after scripted answers (one right, one too high, one too low, one pass-when-bid…) the rows show the matching
   percentages and counts; unit tests for `analysisOf`.
4. Guest merge: a guest answers questions 1–2 (one wrong), signs in (test cookie) → the account's analysis has those
   answers and the mistake.
5. Gate text: guest at question 3 shows the short sign-in reason, en and de.
6. 375×812 and 1280×820: analysis card, mistakes and gate inside the column, no sideways scroll.
