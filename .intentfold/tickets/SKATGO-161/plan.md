# SKATGO-161 plan

## What the code already promises, and what the ticket does not say

- The lesson page (`lesson-page.tsx`) renders on the server only the H1, the kicker and the promise; the
  player is browser-only (`ClientPart`, lazy `pages.ts`). The guide's `intro` ("In short", SKATGO-52)
  is the only body text a crawler reads. ui.md's sub-page row describes that block; the ticket's request
  contradicts it, so ui.md is amended in this ticket. ui.md also forbids hidden keyword text (SKATGO-52
  grill), so the server copy must be visible.
- `exercises.tsx` and `card-row.tsx` already render on the server (bidding practice, quick start), so the
  first teaching card can be rendered there too.
- Lesson minutes (1,1,1,2,2,2,2,2,2,2,3 = 20) back the home page's "half an hour" (SKATGO-2 rework):
  they stay.
- SKATGO-2's rework already asked for "no Grand before lesson 5" (a test exists for drills); this ticket
  generalises it to every concept and every text.
- Lesson ids and `progress.ts` stay, so progress is untouched.
- The rules engine judges every exercise (engineering Key decision); the new interactions are judged by
  it too: points by `pointsOf`, the bid limit by `expectedValue`, the ladder by `BID_LADDER`.

## Route

1. **Concept order** — `lessons/concepts.ts`: each concept the course teaches, the lesson that introduces
   it, and its words in English and German. `lessons.test.ts`: for every lesson, every text the learner
   reads (title, promise, learned line, every step's words, generated drills sampled many times, the
   lesson page's H1/title/description) names no concept of a later lesson; and every concept is named in
   its own lesson (so a pattern cannot silently go dead). Replaces the narrower Grand/Null drill test.
2. **Course text rewritten** (EN reference, DE same cards and answers):
   - L1: deck, one against two, tricks, 120/61 — no card values, no trumps, no bidding; ends with dealing.
   - L2: card values only (rank order moves to L3); ends with "make a trick worth N".
   - L3: trumps, side suits and the order within a suit; no base values.
   - L4/L5: shortened; L5 no "most valuable".
   - L6: base values, matadors, Null 23; no Hand/skat/extras, drills without Hand, no "bid".
   - L7: ladder only to 33 (no 35/46/59), no overbid/Hand; ends with real bidding.
   - L8: skat counting for matadors and Null Hand 35 move here; Hand drills; the Hand risk said
     without "overbid"; two discards from 12, the second the finale.
   - L9: scoring; ends with scoring a pile of real cards.
   - L10: ends with a play.
   - At most two teaching cards before the first question; teaching cards cut to one idea.
   - Each lesson gets a `learned` line.
3. **New interactions** (`types.ts`, `drills.ts`, `exercises.tsx`):
   - `deal`: the learner deals 32 cards in packets 3 · skat 2 · 4 · 3, clockwise from the left; a wrong
     place is refused with the next one named; ends showing the learner's ten cards.
   - `sum`: tap three cards worth exactly N together; any three that make N are right.
   - `bid`: a scripted auction with Lina and Noah (`lessons/auction.ts`, pure, tested); the learner
     answers "Yes"/"Pass" or names the next number, judged against their game's value; the table's own
     bidding words.
   - discards use the existing `pick` (two of twelve).
   - `settlePileDrill`: the declarer's tricks and skat as cards, scored.
4. **Player**: the last exercise of a lesson carries a "Final challenge" kicker; the done screen says
   "You can now: …" from `learned`.
5. **Page**: the "In short" section and `LessonGuide.intro` go; the lesson's first teaching card renders
   on the server as the player's own first screen (`lesson-frame.tsx` shared by the player and the
   server fallback), so a crawler reads the lesson and the page does not jump when the player takes over.
6. **Charter**: ui.md lesson-page row, the widget table; engineering.md's lessons row names
   `concepts.ts` and `auction.ts`.

## Departures from the Proposed solution

None in substance. The finale of a counting lesson (2, 6, 9) is the lesson's skill on real cards
(make a trick worth N; a dealt hand's value; scoring a real pile) rather than a new tap mechanic each.
