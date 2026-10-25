# SKATGO-132 AC check plan

Local web 55132, multiplayer 56132, database 57132; PC 1280×820, phone 375×812. No game played through.

1. **Sharing.** With a finished deal of the day (written to the local database), the result page offers WhatsApp,
   Facebook, Telegram, X (each link opens that platform's share address with our link and words), Instagram and the
   picture download; Playwright reads each link and checks the picture downloads. On the phone the share sheet is
   offered (the platform cannot be driven by a check; left to the human on a phone).
2. **The card.** `/api/card/<code>-de-wide.png` is a 1200×630 PNG under 300 KB showing the score, the AI's and the
   date; no card, contract or name (looked at); the shared page's `og:image` names it; a made-up code gives 404, and
   the score comes only from the code.
3. **Today.** Opening `/d/<code>` the same day: the shared result and the challenge, and the way to today's deal
   (ranked).
4. **After the day.** A code of an earlier day: the page offers the same deal as practice; the practice table opens
   on that day's cards (first state checked: the same hand as the day's deal), unranked. Playing it through and the
   comparison at its end are left to the human.
