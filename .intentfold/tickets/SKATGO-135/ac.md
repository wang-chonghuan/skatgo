# SKATGO-135 acceptance checks

Local web 55135. `tmp/ac.mjs`, Playwright, PC and phone, English and German. Plays no game: "played" is a local test
account whose deal of the day is written finished in the local database.

1. A guest and the test account who has finished today's deal see the same main button: "1 deal today · 2 min" /
   "1 Spiel heute · 2 Min.", after the page has fully loaded in the browser.
2. For the finished account the button leads to /daily (`/en/daily`, `/de/taeglich`).
3. No "Today's result" / "Heutiges Ergebnis" on the front page.

Mechanical defence once before the handoff.
