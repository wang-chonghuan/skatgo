# SKATGO-249 acceptance checks (ticket port 55249 / 56249 / DB 57249)

1. Each of the five cards shows "Passed X / 30" and a progress bar; 0 / 30 untouched — playwright on /en/hard-hands.
2. A won deal adds one to its kind and lengthens the bar — the pass is recorded through the real review route (a deal is
   finished by conceding/claiming only as the product allows; no bot-played game), then the list re-read.
3. Lost but SkatZero lost too → passed; lost and SkatZero won → not passed — multiplayer test on the pass rule with real
   finished games, plus the review's `passed` field observed on a finished deal.
4. A card with progress opens the first deal not passed — playwright: the card's link carries that n, and the table shows
   "n of 30".
5. Guest progress survives a reload; after sign-in it is in the account and seen from another browser — playwright with a
   seeded guest record, then the account record via /api/challenge/progress with a test session (or the service route
   with the test account named), from a fresh context.
6. Account deletion removes the account's passes — multiplayer test over forgetPlayer.
