# SKATGO-161 acceptance checks

Ports: web 55161 (the built server), multiplayer not needed (lesson 11's game is untouched).

## AC1 — no long text under the lesson; the server HTML still teaches
- Command: `curl -s http://localhost:55161/en/course/<slug>` and `/course/<de-slug>` for every lesson.
- True when: no `lesson-intro` / "In short" / "Kurz erklärt" in any page, and each page's HTML contains
  its first teaching card's title and body text (not only the H1 and the promise).
- Browser (headed, phone width, English): lesson 7 page, scroll to the bottom — under the player only the
  ways on (next lesson, rules section, all lessons).

## AC2 — at most 2 teaching cards before the first question
- Test in `lessons.test.ts` over both languages: count of `teach` steps before the first non-teach step ≤ 2.

## AC3 — every lesson 1–10 ends with a hands-on card exercise of its promise
- Test: the last step of lessons 1–10 is not `teach` and shows cards; lesson 1's is `deal`, lesson 7's
  `bid`, lesson 8's a pick of exactly two of twelve.
- Browser: lesson 1 — deal the 32 cards (a wrong place is refused, the right order finishes with 10 · 10 ·
  10 · 2 and the learner's ten cards); lesson 7 — the final auction answered and bid to the end; lesson 8 —
  the two cards put away; lesson 2 — a trick worth N built from three cards. Each step shows the
  "Final challenge" kicker.

## AC4 — the done screen says what the learner can now do
- Browser: finish lesson 1 (and lesson 2): the done screen shows "You can now: …".
- Test: every lesson in both languages has a non-empty `learned` line.

## AC5 — no later concept in an earlier lesson, enforced by a test
- `npx vitest run src/lib/skat/lessons` — the concept-order test passes; it fails on the old course
  (shown once by running it against the base commit's content, recorded in the handoff).

## AC6 — both languages
- AC1–AC5 checks run for `en` and `de` (tests loop over locales; curl both slugs; one German lesson
  opened in the browser for the deal step).
