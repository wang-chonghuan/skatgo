# SKATGO-164 acceptance checks

**Setup:**
- Ticket services: web 55164 (built server, `SKATGO_TEST_ACCOUNTS=1`), multiplayer 56164 with the LLM env and the default AI beat, and a local Postgres on 57164.
- A local test account in a headed Chromium, desktop 1280×820 and phone 375×812.
- A room started against two AIs.
- Acceptance plays no game: it watches what the AIs do on their own, and makes at most the single move the check is about.

**Each criterion and its check:**

1. **AIs one after another, at free play's beat.**
   - Record the time each card lands on the felt while the AIs play, from the table's trick and the cards' `data-*` attributes.
   - True when consecutive AI cards are at least 800 ms apart (free play: 850 ms), and never two in the same frame.
   - Also checked after a finished trick is collected: the cards queued behind it come out one beat apart.
2. **The player's own card, no jitter.**
   - On the player's turn, play one legal card.
   - Sample the trick and the hand every animation frame from the tap until the next AI card.
   - True when, once on the felt, the card never leaves the trick and never reappears in the hand.
3. **Other AI steps at the beat.**
   - With AIs bidding, record each bid's appearance in the auction: at least 800 ms apart.
   - The finished trick is held and collected as in free play.
   - Where the deal gives an AI the skat step, the pick-up, the discard and the game show as separate states. This is observed in the service's own states (multiplayer test), since acceptance does not play to reach it.
4. **Languages and widths.** Criteria 1 and 2 run on `/en/` at desktop width and on `/de/` at phone width.
