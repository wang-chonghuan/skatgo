# SKATGO-151 acceptance checks

Web 55151, multiplayer 56151, local DB 57151, built. Script `tmp/ac.mjs`.

1. Tile: at 360, 375 and 390 wide, en and de, the bidding tile's top and bottom equal Learn's; its title one line.
2. Two steps: step 1 shows Pass, ♣, ♠, ♥, ♦, Grand, Null; a choice marks right/wrong at once; when the AI plays, step 2
   appears with number options; its choice marks right/wrong; then the explanation and "Next question". A pass question
   ends after step 1.
3. Explanation names trumps, Aces, with/without and the value sum (or Null's fixed value / the pass reason).
4. Cheat sheet: a link opens a dialog with all seven sections (what to play, strong enough, points, Grand, how high, seat,
   Null), en and de; it closes.
5. Stats: scripted attempts (right, pass-when-play, play-when-pass, wrong game, wrong value) give matching rows; multiplayer
   test for the record (new shape, old rows read, merge); unit tests for the analysis.
6. Data: a Null question exists and Null is accepted as right there; the first 20 questions are tier 1.
7. 375×812 and 1280×820: question, dialog and stats inside the column, no sideways scroll.
