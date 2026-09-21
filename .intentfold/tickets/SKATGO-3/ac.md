# SKATGO-3 acceptance check plan

Built server on port 55003, headed Playwright, fresh contexts. Basic function only (user's rule; no games).

1. **AC1** — lesson 1 in zh: on step 1 the back button is visible and disabled; after "continue" it is
   enabled, and clicking it returns to step 1 (`data-step` of `skat-lesson`).
2. **AC2** — lesson 1: solve steps with no mistakes up to a choice step, go back two steps, go forward
   again past the already-solved step without answering it, finish the lesson → `skat-lesson-done`
   shows three stars (no mistake counted by revisiting).
3. **AC3** — at 1280×820 and 375×812: back button inside the sticky foot, left of and smaller than
   "continue" (bounding boxes), same kit styling (it is the kit's `Btn`), no horizontal scroll; label
   in each language equals its catalogue entry on `/zh`, `/en`, `/de`; no console errors.
Mechanical defence per engineering.md.
