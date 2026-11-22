# SKATGO-227 AC

Playwright on the production build (web 55227), PC 1280×820 and phone 375×812, English at `/en` and German at `/`.
Each card's click is caught from the page's `skatgo:track` announcement (navigation to the card's page is let happen;
nothing reaches PostHog off the published site).

1. **Every card reports** — clicking each card sends exactly one `home_cta_clicked` with `card` = its section and
   `position` = its place in page order (daily 1, play 2, course 3, league 4).
2. **Old names kept** — daily's carries `button: 'primary'`, play's `button: 'free'`; course's and league's no `button`.
3. **Looks the same** — order daily, play, course, league; colours green, red, orange, navy; the League's "Hot" and cup.
4. **Live** — after deploy, the post-deploy check serves the merge commit and https://skatgo.com/en shows the same
   cards (read in the browser, no card clicked).
