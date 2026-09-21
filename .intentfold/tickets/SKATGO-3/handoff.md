# SKATGO-3 handoff — 课程每一节可以返回上一节

## What changed

- `app/src/components/skat/lesson-player.tsx`: the lesson remembers every solved step (a set, not one
  flag); a back button — the kit's `Btn tone="quiet"` at the default size, one below "continue" — sits
  left of "continue" in the sticky foot, disabled on the first step; the foot aligns and spaces the two.
- `app/src/components/skat/exercises.tsx`: Choice, Pick, Order and Play take `solvedBefore` and open in
  their solved state (correct answer, highlighted cards, ✅ explanation) when the learner comes back.
- `app/messages/{zh,en,de}.json`: `lesson_back` = 「← 上一节」 / "← Back" / "← Zurück".
- No new component, token or dependency; progress storage and the stars rule unchanged.

## AC results

Built server on port 55003, headed Playwright, `tmp/ac.mjs` + `tmp/revisit.mjs` (uncommitted). Basic
function only, per the user's rule — no games played.

1. **AC1 — pass** (zh/en/de × desktop/phone): back is disabled on step 1; after "continue" it is
   enabled and returns to step 1.
2. **AC2 — pass** (zh/en/de, desktop): lesson 1 solved with no mistakes, stepped back over a solved
   choice (answer shown, "continue" enabled), forward again without re-answering, lesson finished with
   three stars. Revisit also checked for pick, order and play steps (lessons 3–4, zh): answer shown,
   "continue" enabled. A revisited game step (lesson 11) was not exercised — gameplay is the user's.
3. **AC3 — pass** (zh/en/de × 1280×820 / 375×812): button left of "continue", same row, smaller in
   width and height, label from each language's catalogue, no horizontal scroll, no console errors.
- Mechanical defence (typecheck, build, 47 tests, client-bundle check, grep = 1, SSR link) passes.

## Deviations

None from `plan.md`; the two open design points were settled by the human in the grill.

## Environment

Ports: web 55003. No env keys added, changed or removed.

## Residual

- Going back to the whole-game step of lesson 11 re-deals the game (the table is not kept while away);
  the step stays passable because it was solved.
- SKATGO-2 (unmerged) edits `drills.ts` / lesson content; this ticket edits `lesson-player.tsx`,
  `exercises.tsx` and the message catalogues — the two branches touch different lines.
