# SKATGO-220 AC check plan

Production build on port 55220 with the local multiplayer service (56220) and database (57220), a local
test account (`skatgo_test_account`) given coins/points/today; `/en/league`. Headless Chromium (Playwright).

1. **One line at phone widths** — at 360, 375, 390 and 412 px (isMobile, hasTouch): inside
   `[data-testid=league-coins]` the icon, the number, "coins" and "+100 today" share one line box
   (their tops lie within the row; same `getBoundingClientRect().top` band); inside
   `[data-testid=league-points]` the number and "League points" share one line. Desktop 1280×820 too.
   Screenshot each.
2. **Very narrow** — at 280 and 240 px: `document.documentElement.scrollWidth <= innerWidth`, and every
   element of the card stays inside the card's box; items wrap only when the row is full. Screenshot.
3. **Values unchanged** — the card's `data-coins`/`data-points`, the lines text, the progress bar and the
   play button are present with the same values as before (compare against the base build's DOM text).
