# SKATGO-7 acceptance check plan (basic function only, no games)

Built server on port 55007, headed Playwright.

1. Fresh context, `/zh`, `/en`, `/de`: 11 lesson cards, all links (`a[data-testid=skat-lesson-card]`),
   no 🔒; each opens its lesson (`skat-lesson` visible, URL `/xx/lesson/n`).
2. Fresh context, direct `/zh/lesson/7` (and en/de): lesson 7 shows, URL unchanged, no bounce to the map.
3. Context with lessons 1–3 recorded (the product's progress key): cards 1–3 show stars, "continue"
   points at lesson 4, card 4 is `data-state="next"`. No console errors; desktop and phone.
