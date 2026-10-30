# SKATGO-163 acceptance checks

**Setup:**
- Ticket services: web 55163 (built server, `SKATGO_TEST_ACCOUNTS=1`), multiplayer 56163 with the LLM env, and
  a local Postgres on 57163.
- Three local test accounts via the cookie `skatgo_test_account=<name>.<ms>`, each in its own headed Chromium
  context (phone 375×812 for the main viewer, desktop for the others).
- Old schema-2 rooms: the migration test.

**Each criterion and its check:**
1. **Two cards.** `/en/with-friends`, signed in: cards `rooms-new` and `rooms-join`. Signed out: tapping
   either opens sign-in (Clerk's modal is not driven; the button's presence and the prompt are checked).
2. **A new room waits.**
   - Opening a room leads to `/en/table/<6 digits>`, its waiting page: the number, "Copy link", the host and two
     empty seats, nothing dealt; "Start game" disabled.
   - "Copy link" puts `…/en/table/<number>` on the clipboard (read via `navigator.clipboard` with permission
     granted) and shows "Link copied".
3. **Before the start.** A second account enters the number on the friends page:
   - it sits in an empty seat at once and reads that the host starts;
   - the host gives the last seat to the AI, takes it back, gives it again; "Start game" is enabled only with every
     seat taken;
   - "Start game" puts both at the table, the AI in the third seat.
4. **The table button.** A room's top-right button is the table's (a spade, `aria-label` "Table"), not the way out;
   its menu holds Keep playing, "Room … · copy link", Remove <name> (host), Leave the room. Free play keeps the way
   out.
5. **After the start.** An account entering the number while a deal is played:
   - it sits in a computer's seat under its own name;
   - it sees "You play from the next deal" during the running deal;
   - once the next deal is dealt it holds cards, with a total of 0.
6. **A third and a fourth account.** The third replaces the last computer. A fourth gets "This room is full".
7. **Wrong numbers.**
   - A number that is not a room gives "There is no room with this number".
   - The 11th wrong number within a minute gives "Too many tries — wait a minute".
8. **Back to room.** While in a room, the friends page shows only `rooms-back` with the number. A second
   context of the same account goes back to the same seat.
9. **An away seat is taken.**
   - Account B closes its page. After the 30 s grace a computer plays B's seat.
   - Room capacity (all three seats taken) lets account D enter the number and claim B's seat.
   - B's friends page then shows the two cards.
10. **Removing a person.** The host removes C from the menu:
   - C's seat goes to a computer (before the start, it is empty again);
   - C's page leaves the table, and C's friends page shows two cards;
   - C enters the number again and is back in.
11. **Leaving.**
   - The host chooses Leave room, and B becomes host (B's menu offers Remove).
   - When B and the rest leave, the number gives "no room".
12. **The pause.** With every person's page closed, the deal's revision stops moving: observed by the
    service's state through a key client, over 5 s.
13. **Referral.** An account the test-account cookie marks as new (created now) claims a seat. Then
    `account_referrals` holds (account, host, room).
14. **Both languages.** The German friends page, waiting page and table: the cards, the waiting page, the table
    button's name and the messages are German. The tests also cover message parity.
