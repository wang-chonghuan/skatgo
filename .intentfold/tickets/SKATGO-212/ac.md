# SKATGO-212 acceptance check

Run against the ticket's services (web 55212, multiplayer 56212, database 57212) with a production build. Data seeded
into the ticket database only: six accounts with XP, one in each League tier.

1. **No coloured square.** Playwright, home (EN, 1280): every XP-board badge is an image whose corner pixels are
   transparent (read from the decoded image) and that has no rounded corners; the same on the League board.
   Screenshot of both boards.
2. **Bronze, silver, gold the same medal in three colours.** The three badge images, same size, compared pixel by pixel:
   their transparent shape is the same (alpha differs nowhere by more than a few levels), and their medal colour differs
   (bronze orange-brown, silver grey, gold yellow). Shown side by side in the screenshot.
3. **Legend the cup, diamond darker.** The legend badge's shape is the gold tier picture's cup; the diamond badge's mean
   lightness is lower than the shipped one's. Shown in the screenshot.
4. **Fits.** Playwright, home and League page, EN and DE, 375 and 1280: each badge is 24×24, vertically centred on its
   row, and every row's name, win rate and XP (League: name and points) stay on one line inside the row.
