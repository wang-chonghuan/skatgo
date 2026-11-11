# SKATGO-184 acceptance check

Production build on 55184 (web) and 56184 (multiplayer). Playwright with `colorScheme` emulation, desktop 1280×820 and phone 375×812, EN and DE.

1. **Follows the device.**
   - With `colorScheme: 'dark'` and no cookie: the front page, profile and free play have a dark `body` background (computed luminance < 0.1), and `color.surface` cards are dark.
   - With `colorScheme: 'light'`: the computed colours equal today's light values (page `#F2F4F7`, surface `#FFFFFF`).
2. **Manual choice.**
   - In the settings dialog, choose Dark on a light device: the page turns dark at once, stays dark after a reload and on another page.
   - Choose Light on a dark device: it stays light.
   - Choose System: it follows the device again.
3. **No white flash.**
   - With the dark cookie: the server HTML's `<html>` carries the dark theme class and `data-theme="dark"`, checked with JS disabled.
   - With `colorScheme: 'dark'` and no cookie: the first paint is dark, because the stylesheet's media query applies before any script.
4. **Readable everywhere.**
   - Screenshot sweep at night: front page, course page and a lesson, rules, Skat-Tricks list and an exercise, bidding practice, forum and a post, profile, daily, free play table (bidding and play), friends' room page, sign-in (Clerk), settings dialog. Phone and desktop, EN; DE for the front page and the table.
   - Scripted contrast scan on each: every visible text node's colour vs. its effective background, contrast ≥ 3:1. No element keeps a light background (luminance > 0.8) except playing cards and images.
5. **Table.** In free play, the felt's background is the same day and night. A card face is white by day and `#D8DCE1` at night, and the card's drawing is multiplied with it (rework round 1).
6. **No sideways scroll and no layout change:** element boxes on the front page are equal in both modes.
