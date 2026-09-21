# SKATGO-1 acceptance check plan

Checked against the **built** server (`npm --prefix app run build`, then
`(cd app && PORT=55001 node .output/server/index.mjs)`), with headed Playwright Chromium, scripts in
`.intentfold/tickets/SKATGO-1/tmp/`. Viewports: desktop 1280×820, phone 375×812 (`isMobile`,
`hasTouch`). Every browser context is fresh (no cookie, no localStorage) unless stated.

## AC1 — browser language decides the first visit, and nothing of another language leaks in

For each browser locale `zh-CN`, `en-US`, `de-DE` (Playwright `locale`, which sets
`Accept-Language` and `navigator.languages`):

1. Open `/` → final URL is `/zh`, `/en`, `/de` respectively; `<html lang>` is `zh-Hans`, `en`, `de`.
2. Collect the visible text of: header + course map; lesson 1 (a teach step and a choice step); the
   free-play table (`/xx/play`) through bidding to the first trick with a hint shown.
3. Leak check on that text:
   - en / de: **no CJK character** anywhere;
   - de: none of a list of the English UI strings from `messages/en.json` that are not also German
     (built from the catalogues, not hand-typed);
   - zh: none of the en or de UI strings that are not also Chinese (same derivation).
   The Skat words that stay German in every language (Grand, Null, Hand, Schneider, Schwarz, Ouvert,
   Matador, Skat) are allowed by construction since they appear in the catalogue of every language.

True when all three languages pass at desktop.

## AC2 — switcher top right, immediate switch, the choice sticks

At **both** viewports, starting from a fresh `en-US` context on `/en/lesson/1` … (lesson 1 is open to
a new learner) and on `/en`:

1. The switcher is visible; its bounding box sits in the header and its right edge is within 32px of
   the viewport's right edge; no horizontal page scroll (`scrollWidth <= innerWidth`).
2. Click `DE` → URL becomes `/de/…` with the same path, visible text is German (header brand and the
   page's heading change).
3. Reload → still `/de/…` in German. Open `/` in a new page of the same context → lands on `/de`.

## AC3 — a whole lesson and a whole game in each language; language changes no outcome

For each of zh / en / de at desktop, plus one language at phone:

1. Lesson 1 from start to "lesson done": answer each choice by `data-correct="true"`; reaching
   `skat-lesson-done` proves judging works.
2. `/xx/play`: play a whole game — pass or bid via the table's buttons, take the skat / discard via
   the hint when declarer, play `data-legal="true"` cards — until `skat-result` appears.
3. **Language-independence** (mechanical, unit level): the parity test in `lessons.test.ts` proves the
   three courses have identical cards/answers/best cards per step, and the engine tests run unchanged
   because the engine no longer contains language.
4. No `console.error` / `pageerror` during any of the runs.

## Also run (not AC, required by engineering.md)

The mechanical defence in `charter/engineering.md` § Tools, once, before the handoff.
