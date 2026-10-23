# SKATGO-126 acceptance checks

1. **No rename on the board.** Playwright, a test account with a finished tournament: the daily board has no name line
   and no "Ändern".
2. **The nickname in the settings, everywhere.** The test account opens the settings, sees its name, saves a new one;
   today's board, an earlier day's board, the front page's Elo board and its forum post show the new name.
3. **Taken or refused.** Saving another player's name, or an empty / refused one: the message, nothing changes.
4. **Guests.** Signed out, the settings have no nickname section.
