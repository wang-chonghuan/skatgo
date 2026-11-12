# SKATGO-189 acceptance checks

Signed in locally (the owner's records copied into the ticket DB), production build on 55189, desktop 1280×820
and phone 375×812, Playwright script in `tmp/`.

1. Front card: every `history-line` shows a contract or "Passed in", a Declarer/Defender tag except on passed
   rows, only J/A/10 card labels (no K, Q, 9, 8, 7), a date and a signed difference; no "Lina"/"Max" text in the
   list. True when all rows satisfy it.
2. Profile: open "Your games"; every `history-row` satisfies 1 and has the "Replay" link (an `<a>`, not a
   button); following it opens `/replay` with the deal. True when both hold.
3. German (`/de/`): the same checks with Alleinspieler/Gegenspieler and B/A/10. Screenshot to look at once.
4. Dark mode (colorScheme dark): screenshots of both lists; tags and text read clearly — judged by looking.
