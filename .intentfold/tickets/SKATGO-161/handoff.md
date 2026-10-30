# SKATGO-161 handoff

## What changed

- **Lesson page** (`lesson-page.tsx`, new `lesson-frame.tsx`):
  - The "In short" / "Kurz erklärt" text under the lesson is gone, with the guides' `intro` field and its 100–200-word test.
  - The server now renders the lesson's first teaching card inside the player's own frame (progress row, card, back/continue bar). A crawler reads the lesson itself, and the page does not jump when the player takes over.
  - The rules link under a lesson reads "This lesson in the rules" / "Diese Lektion in den Regeln". The rules section's title used to name Grand on lessons 3–4 and Schneider on lesson 8.
- **Player** (`lesson-player.tsx`):
  - A lesson's last exercise carries the kicker "Final challenge" / "Abschlussaufgabe".
  - The done screen says "You can now: …" / "Jetzt kannst du: …" from each lesson's new `learned` line.
  - Its next button says "Next lesson". The long lesson-10 title no longer overflows the button.
- **New exercises** (`exercises.tsx`, `types.ts`, `drills.ts`, new `auction.ts`):
  - `deal`: the learner deals 32 cards in packets (3 each, 2 to the skat, 4 each, 3 each, clockwise from the left). A wrong place is refused with the right one named. At the end the learner's own ten cards turn face up.
  - `sum`: tap three cards worth exactly N. Any three that add up are right; a wrong three is told its sum.
  - `bid`: an auction on the felt against Lina and Noah, each seat showing its latest call, in the table's own bidding words.
    - The learner's limit is the engine's value of the game they would play.
    - Every call is judged against that limit. A wrong one is refused with why: "Your game is worth 20: 18 is still within it."
    - `auction.ts` plays the two duels from three limits and is tested.
  - `settlePileDrill`: the declarer's five tricks and the skat as cards, to count and score.
  - `gameValueDrill({ hand })`: Hand games only when asked for (lesson 8). Its prompt no longer says "how high can you bid".
- **Course text** (`content.en.ts`, `content.de.ts`), rewritten under three rules: no later concept, at most two teaching cards before the first question, and a final challenge on cards.
  - **L1:** deck, one against two, tricks, 120/61. No card values, trumps or bidding. Ends with dealing.
  - **L2:** card values only. Ends with two "make a trick worth N".
  - **L3:** trumps, side suits, the order within a suit. No base values.
  - **L5:** no "most valuable game".
  - **L6:** Null is worth 23. No Hand, skat or extras; its drills are without Hand.
  - **L7:**
    - The ladder stops at 33, so it shows no 35/46/59.
    - No overbid question and no "Spades Hand" option.
    - Two auctions: answering as forehand, then bidding and answering as middlehand as the finale.
  - **L8:**
    - The skat counting for matadors and Null Hand 35 move here, with two Hand value drills.
    - The Hand risk is told without "overbid".
    - Both discards are taps on twelve cards; the second is the finale.
  - **L9:** ends with scoring a real pile. The tournament-bonus tip is gone.
  - **L10:** ends with a play.
  - Teaching cards and verdicts are cut to the point. Lesson minutes are unchanged (20 in all).
- **Concept order** (new `concepts.ts`, `lessons.test.ts`):
  - Each concept the course teaches is listed with its lesson and its English and German words.
  - The test reads every text of every lesson: title, promise, learned line, every step, the drills dealt 40 times, and the page's title and description. It fails when a lesson names a later concept, or when a concept is first named anywhere but its own lesson.
  - It replaces SKATGO-2's narrower "no Grand/Null drill before lesson 5".
  - New tests also cover: the first step is teaching; at most two teaching cards before the first question; each lesson ends with a challenge on cards (1 deal, 7 bid, 8 two of twelve); a `learned` line for every lesson; the deal's packets; the auctions.
- **Messages** (en/de): the new steps' words, `lesson_challenge`, `done_learned`, `lesson_rules_this`. `lesson_in_short` is removed; `done_next_lesson` takes no title.
- **Guides:** lesson 2's and lesson 6's search descriptions no longer mention rank or extras.
- **Charter:**
  - `ui.md`'s lesson-page row now says no text stands under the lesson, and describes the challenge kicker and the done line.
  - `ui.md`'s widget table gains `Sum` / `Deal` / `Bid`.
  - `engineering.md`'s lessons row names `concepts.ts` and `auction.ts`.

## AC results

1. **No long text under the lesson; the server HTML still teaches — pass.** All 22 lesson pages, English and German, were fetched from the built server on 55161. Each has `skat-lesson-first` with its first teaching card's title and body, and no `lesson-intro` or "In short" / "Kurz erklärt" heading (`tmp/ac1.txt`, 22/22). At phone width, lesson 7's page shows only the three links under the player (`tmp/shots/lesson-7-page-full.png`).
2. **At most 2 teaching cards before the first question — pass.** Test "every lesson opens with a teaching card, and at most two come before the first question", in en and de.
3. **Every lesson 1–10 ends with a hands-on card exercise of its promise — pass.** Headed Chromium at 375×812, `tmp/accept.mjs`, 33/33 (`tmp/ac3-ac4.txt`):
   - **Lesson 1:** dealing refuses a wrong place ("Not there: the next 3 go to Lina."), deals out 10 · 10 · 10 · 2, and shows the learner's ten cards.
   - **Lesson 2:** a wrong three is told its sum; a right three is accepted.
   - **Lesson 7:** passing at 18 and holding 22 are refused with the limit. Both auctions run to the end.
   - **Lesson 8:** putting the ♣A away is wrong; ♥10 + ♦7 is right.
   - **Lessons 3, 4, 5, 6, 9, 10:** the last step shows cards under "Final challenge".
   - The test "every lesson ends with its final challenge on cards" holds the same for both languages.
4. **The done screen says what the learner can now do — pass.** "You can now: …" seen after lessons 1–10 in the browser, and "Jetzt kannst du: …" after German lesson 1. A test requires a `learned` line in every lesson.
5. **No later concept in an earlier lesson, enforced by a test — pass.** `npx vitest run src/lib/skat/lessons` is green. The test is red on the base commit's course: "lesson 1 names 'the value of each card' (taught in lesson 2): **④ Counting**: … A 11, 10 10, K 4 …" in both languages.
6. **Both languages — pass.** The tests loop over en and de, all 22 pages were fetched, and German lesson 1 was walked in the browser (deal refusal in German, "Abschlussaufgabe", "Jetzt kannst du").

Mechanical defence passed on the final code: typecheck, build, 317 tests, client bundle, design tokens, grep 0, SSR link, check:seo, and test:seo.

## Deviations

- **Final challenges for lessons 2, 6 and 9:** each is the lesson's skill on real cards (make a trick worth N, a dealt hand's value, scoring a real pile), not a new tap mechanic each.
- **Lesson 7's auction sits on the felt with three seats.** The plan had a list of calls; the fresh-eyes look said a 14-row list read like a ledger.
- **"Next lesson: <title>" stays under each lesson,** as the course's table of contents. Only the rules link lost its section title. (Grill 5 named "next lesson" pointers inside a lesson's text; navigation is not lesson text.)

## Environment

- **Ports:** web 55161 (built server, `app/.env` loaded). Multiplayer and the database were not started; lesson 11's game is untouched.
- **Env keys:** none added, changed or removed.

## Residual

- None for this ticket.

## Check

1. Lesson 7's auction on the felt: a table of three seats, not a chat.
2. Lesson 1's dealing finale: 10 taps, wrong places refused.
3. How short the teaching cards are now; lesson 3 is a good sample.
4. The done screen's "You can now: …" line and the plain "Next lesson" button.
5. The page under a lesson: only three links remain.

## Decided for you

- What a search engine reads: the server renders the lesson's first teaching card, visibly. There is no hidden text (SKATGO-52 ruled that out).
- Lesson 1 keeps "120 card points, the declarer needs 61" as the goal of the game. Single card values are lesson 2's.
- The order within a suit moved from lesson 2 to lesson 3, together with trumps.
- Null's values arrive where their extra does: 23 in lesson 6, 35 in lesson 8, 46 and 59 in lesson 9. Lesson 7's ladder stops at 33.
- "No later concept" is strict: no "next lesson covers…" pointers in the text either.
- Dealing order is the real table's: 3 each, 2 to the skat, 4 each, 3 each.
- The auctions are fixed hands with Lina and Noah at the other seats, values never above 33.
- Lesson minutes stay (20 in all, the home page's "half an hour"). Lesson ids stay, so finished lessons stay finished.
- The rules link under a lesson reads "This lesson in the rules", and the done button "Next lesson". Neither names a later topic, and the button fits.
- The tournament +50 tip in lesson 9 is gone.
