# SKATGO-182 acceptance checks

Local, on the ticket's ports (web 55182, multiplayer 56182, database 57182). No game is played: a guest's deals are
seeded into the ticket database under a known device's `anon:` id, and the browser carries that device's cookie.
Recording a finished free deal for a guest is covered by the service's test of `/free/review` with an `anon:` player.

1. **Guest free deals count for a new account.** Seed three free deals for device A; sign in on that browser as a
   fresh local test account. Pass: `/api/daily/xp` lists the account with XP and win rate from those three deals;
   `/profile`'s history lists them.
2. **A guest's past deal of the day counts.** Seed a daily size-1 entry for device A on an earlier day. After sign-in
   it is in the account's history and XP; that day's board (`/api/daily/board`) still shows the guest's row with its
   old name.
3. **An existing account keeps its deals.** An account with seeded deals signs in on device B with guest deals. Pass:
   history and XP = account's + guest's, each deal once (counts compared before and after).
4. **Guests still play free and are not on the board.** `/play` opens and deals without a sign-in prompt; the XP board
   has no `anon:` row (no row without an account's name).
5. **Guest card and page.** Device A, signed out: the front page's My progress card lists the deals, newest first,
   and is a link to `/profile`; there the history is open (no fold) with the sign-in. Device with no deals: the card
   shows the sign-in line and button as before.
6. **Account card and page.** Signed in: the card shows figures and curve as before; `/profile` starts with the folded
   history, opening to every deal including the merged guest ones; the sections under it unchanged.
7. **Layout.** 5 and 6 at 1280×800 and 390×844, `/en` and `/` (German): no horizontal scroll, no console errors.
