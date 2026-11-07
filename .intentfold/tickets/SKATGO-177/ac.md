# SKATGO-177 acceptance checks

Production build, web 55177 / multiplayer 56177, Playwright headed, 1280×820 and 375×812 (isMobile, hasTouch).

1. Free play, player's bidding turn: the lightbulb opens "Power-ups" with three cards; no element overflows the dialog
   (scrollWidth ≤ clientWidth); screenshot both sizes.
2. Same moment: Win chances is the open card; its table has 7 rows; suit and Grand rows carry a percent (0–100%).
3. Put away: `POST /api/free/putaway` with a token whose game is at the discard (reached by script through the server's
   own routes, bidding until the player declares) returns two cards from the player's twelve and a game; the card shows them.
   If no deal of the run reaches it, a server unit test over a pool deal covers the route and the browser check is left to you.
4. Card counter during play (pass, wait for the player's card): shows the trumps and side suits still out and the points;
   after the next trick its numbers change.
5. Deal of the day's table: no lightbulb, no power-ups.
