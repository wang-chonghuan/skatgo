# SKATGO-130 AC check plan

Local web 55130, multiplayer 56130, database 57130. Desktop 1280×820 and phone 375×812. No game is played through.

1. **No assistant anywhere, its endpoint gone.** Playwright on the front page, the course, a lesson, the rules, free
   play and the tournament page: no launcher, no chat window. `POST /api/ask` answers 404. The built client has no
   `deep-chat`. Pass: all.
2. **No hint in free play.** At the free-play table during the auction (the phase it opens in) no hint button or tab;
   the hint code path is switched off for free play by the table's switch, covered by the bidding, skat, discard,
   declaring and play controls all reading it — checked in the code and at the auction on screen. Lesson 11 still
   shows its hint button at the auction. Pass: free play none, lesson 11 has it.
3. **Free play's controls match the tournament table's at the same size.** Playwright opens both tables at the
   auction on PC and phone and lists the table's controls (buttons, tabs, menus); the lists are equal apart from the
   differences the handoff names as the function's own. Pass: equal.
