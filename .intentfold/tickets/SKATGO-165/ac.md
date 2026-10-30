# SKATGO-165 acceptance checks

**Setup:**
- Ticket services: web 55165 (built server, `SKATGO_TEST_ACCOUNTS=1`), multiplayer 56165 with the LLM env, and a local Postgres on 57165.
- Test accounts in headed Chromium.
- Acceptance plays no game. Finished deals come from AIs playing: the host is "away" on a closed page while the computer plays its seat, then comes back. Or deals end passed in, the host passing when asked.

**Each criterion and its check:**

1. **Deal number.**
   - On a room's table, the board's deal line reads "Deal 1", and "Deal 2" after the next deal; German "Spiel 1".
   - Free play's board still reads "Deal 1 of 6".
2. **Statistics.**
   - The table menu has "Statistics". It opens a dialog with one block per finished deal: its game line and three seat scores, then the totals.
   - The latest deal's scores equal the settlement's "This game" line, and the totals equal the board's totals.
   - With no finished deal, the dialog says so. Closing it returns to the table.
3. **Next deal waits for the people here.** With two accounts in a room, at a settlement:
   - A presses Next deal. A's button reads "Waiting for <B>" and is disabled.
   - B still sees the settlement, and the deal number stays.
   - B presses, and both get the next deal.
4. **Alone with the AI.** One account: Next deal deals at once.
5. **No hanging.**
   - A presses, B closes the page: the next deal comes without B.
   - The same with B leaving the room, and with the host removing B. These are checked in the multiplayer integration test, where states can be driven.
6. **Languages and widths.** Criteria 1–3 on `/en/` desktop and `/de/` phone.
