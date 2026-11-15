# SKATGO-199 acceptance checks

Production build on web 55199 (multiplayer not needed for lesson pages).

1. Folded whole-lesson text, en and de. Playwright on /en/course/how-does-skat-work and /de/kurs/wie-funktioniert-skat:
   `[data-testid=lesson-text]` exists, is closed; after clicking its summary it is open and shows the lesson's
   step texts in order (first and last teaching titles visible). Also every lesson in both languages renders the block.
2. Without JavaScript: `curl` each of the 22 lesson pages; the HTML contains the title and first body paragraph of
   every `teach` step of that lesson (checked against the lesson data), not only the first step.
3. Unchanged when folded: on a lesson page the head, the player (first card, Continue works) and the three links are
   as before; screenshot at 1280 and 375 with the block closed shows one added line under the links.
4. After deploy: Bing URL Submission shows the lesson URLs submitted; Google URL Inspection shows "Indexing requested"
   for the URLs submitted today (quota), the rest recorded for the next day.
