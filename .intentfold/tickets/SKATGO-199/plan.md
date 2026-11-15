# SKATGO-199 plan

What the code already says, beyond the ticket:
- `/course/$slug` renders `LessonPage` (`components/skat/lesson-page.tsx`) on the server: title, kicker, promise, then
  the player, whose server fallback is only the lesson's first teaching step (`FirstCard`, SKATGO-161), then the
  `lesson-links` nav (next lesson / this lesson in the rules / all lessons). That first step is all a crawler reads.
- A lesson is `Lesson.steps` (`lib/skat/lessons/types.ts`): `teach` (title, body[], tip), `game` (title, body[]),
  and exercises (`choice`, `pick`, `order`, `play`, `sum`, `deal`, `bid`) with a `prompt` (some a `context`) and an
  `explain`; `generated` steps are built in the browser only and have no text on the server.
- Folded content already exists on the site as a native `<details>` with a link-like `<summary>` (the deal of the
  day's "how the AI played", `deal-of-day.tsx`); closed, its content is still in the HTML.
- ui.md's lesson line says "No text stands under the lesson (SKATGO-161 …)"; the human's request amends it.

Route:
1. `lesson-page.tsx`: after the `lesson-links` nav, a `<details data-testid="lesson-text">`, closed, in the same
   reading column; its `<summary>` looks like the links above it (`appBtnStrong`, `info`). Inside, every step in
   order: `teach`/`game` → title (h3) and paragraphs (+ tip); exercises → prompt (+ context) and explain;
   `generated` → skipped. Text through the existing `Rich` (bold, coloured suits). Card pictures are not drawn.
   The nav's bottom padding moves under the new block so the page's spacing stays as it is when folded.
2. Messages `lesson_text`: en "Read the whole lesson", de "Die ganze Lektion zum Nachlesen".
3. ui.md: the lesson line records the folded whole-lesson text under the links (SKATGO-199).
4. After deploy (cap4): Bing URL Submission for the 22 lesson pages; Google URL Inspection → request indexing,
   English first within the day's quota, German the next day.
