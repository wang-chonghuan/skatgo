# SKATGO-199 handoff

## What changed

- `app/src/components/skat/lesson-page.tsx`: under every lesson's links ("next / this lesson in the rules / all
  lessons"), a closed native `<details data-testid="lesson-text">` whose summary reads like those links. Open, it lists
  the lesson's own steps in order: a teaching step and the final game give their title (h3) and paragraphs (and the
  tip); an exercise its question (and context) and the explanation of its answer; a step built in the browser
  (`generated`) is skipped; no cards are drawn. Text goes through the existing `Rich` (bold, coloured suits). It is
  rendered on the server, so the HTML holds it closed or open. The links' bottom padding moved under the new block.
- `app/messages/{en,de}.json`: `lesson_text` — "Read the whole lesson" / "Die ganze Lektion zum Nachlesen".
- `.intentfold/charter/ui.md`: the lesson-page line now records the folded whole-lesson text (SKATGO-199) beside
  SKATGO-161's "no open text under the lesson".

## AC results

Production build of this branch on http://localhost:55199.

1. **PASS.** `/en/course/how-does-skat-work` (1280), `/de/kurs/wie-funktioniert-skat` (375), `/en/course/how-bidding-works`
   (375): the block is closed on load; clicking its summary opens it; 7, 7 and 9 steps listed, the first title visible.
   All 22 lesson pages render the block (check 2).
2. **PASS.** Fetched all 22 lesson pages without a browser and compared with the lesson data: the title and first
   paragraph of every teaching step of each lesson are in the HTML — 120 of 120 found (whitespace ignored, since
   bold words are separate elements).
3. **PASS.** With the block closed the page is as before plus one line under the links (screenshots in
   `tmp/`); the player still works (Continue moves to step 2); no page errors.
4. After deploy — done in cap4 (Bing URL Submission, Google request indexing), recorded on the ticket.

Mechanical defence passed once: typecheck, build, 346 unit tests, client bundle, design tokens, literal grep, SSR link,
`check:seo --built` (52 indexable pages) and `test:seo`.

The look through the human's eyes was not run: the request fixed the shape (folded, the lesson's own words) and
the screenshots show it.

## Deviations

None from `plan.md`.

## Environment

Ports: web 55199 only. No env keys added, changed or removed.

## Residual

- At 375px the German pages scroll sideways by 28px: the header's "Anmelden" button sticks out. It is the same on
  production today and not caused by this ticket.

## Check

1. https://skatgo.com/en/course/how-does-skat-work — at the bottom, "Read the whole lesson": closed by default; open it and read.

## Decided for you

- The block sits last, under the three links.
- Exercises show their question and the explanation of the answer (folded, so the player is not spoiled).
- No card pictures in the text; the lesson's own words only.
- Summary wording: "Read the whole lesson" / "Die ganze Lektion zum Nachlesen".
- The quick-start page is not part of this (it already renders its text).
