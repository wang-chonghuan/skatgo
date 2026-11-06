# SKATGO-176 acceptance checks

Run against the production build on web 55176 / multiplayer 56176, Playwright headed, 1280×820 and 375×812 (isMobile, hasTouch).

1. Free play bidding: `[data-testid=skat-calc]` absent while the player bids; settings dialog has no `settings-bid-calc`
   switch and no "Game value" heading. → both absent.
2. Free play, player's turn to play: `[data-testid=skat-hint]` visible at the felt's left edge; tapping it shows
   `[data-testid=skat-hint-text]` with a non-empty hint. → visible, text non-empty.
3. Free play bidding: an `info` hint button ("Hint") in the bidding drawer; tapping it shows the hint text. → shown.
   (Skat / declare hint buttons share the same flag; checked when the player reaches those phases in the run.)
4. Daily deal of the day table (`/daily/play?size=1`, test account): no `skat-hint` tab and no hint button in the bidding drawer.
5. Both viewports.
