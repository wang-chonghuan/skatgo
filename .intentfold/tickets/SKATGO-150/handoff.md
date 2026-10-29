# SKATGO-150 handoff

## What changed

- **Record of answers** (bidding practice, SKATGO-149):
  - `multiplayer`: a new table `bidding_answers` (`src/store.ts`) and `src/bidding.ts`, mounted at `/bidding`:
    - `state`, `answer` and `merge`, behind the admission key.
    - Per account and question it keeps the first answer and whether it was put right since.
    - An answer that is not one of the question's options is refused.
  - Web: `lib/tricks-handler.ts` now forwards `/api/tricks/bidding/*` as well as the ladder.
  - Test: `multiplayer/test/bidding-record.test.ts`.
- **Logic** (`lib/skat/bidding/practice.ts`): `questionId` (`<deal>-<seat>`), `numberOf`, `analysisOf` and `mistakesOf`. Unit tests are in `practice.test.ts`.
- **Client record** (`lib/skat/bidding/record.ts`): a guest's free answers stay in localStorage; an account's go through the service. The guest's answers are merged in at sign-in, as the ladder does.
- **Page** (`bidding-practice-page.tsx`):
  - Under the question, a white "Your bidding" card with "n answered", then Wrong (the error rate), Overbid and Underbid as shares of first answers.
  - Each wrong kind shows only the causes that happened ("Game too high: 1", "Passed instead of bidding: 2").
  - Then "Mistakes": numbered `quiet` buttons that open the question again. "Next question" returns to the run.
  - No bar and no colours of its own. The card is hidden until the first answer.
  - `Choice` gained `onChoose` (`exercises.tsx`).
- **Gate text**: "Save your mistakes and get better." / "Speichere deine Fehler und werde besser."
- **Charter**: product.md, ui.md and engineering.md describe the record, the analysis and the gate.

## AC results

Web 55150, multiplayer 56150, local DB 57150, built. Script: `tmp/ac.mjs`, 9/9.

1. **PASS.** A test account answered 5 questions; a fresh browser with the same account showed the same counts and mistakes. The multiplayer test confirms that the first answer stays, a later right answer fixes the question, and an answer not offered is refused.
2. **PASS.** A wrong answer adds its number. Clicking it showed "Question 1 of 300". Answering it right emptied the list.
3. **PASS.**
   - Guest after a wrong (too high) and a right answer: Wrong 50%, Overbid 50% "Game too high: 1".
   - Account after right, high, low (pass), pass and right: Wrong 60%, Overbid 20% "Game too high: 1", Underbid 40% "Passed instead of bidding: 2". These match the answers given. Unit tests cover all four causes.
4. **PASS.** The guest's two answers, one redone, appeared in the account after sign-in, and the browser's copy was cleared.
5. **PASS.** The gate line reads "Save your mistakes and get better." in English and "Speichere deine Fehler und werde besser." in German.
6. **PASS.** At 375×812 and 1280×820, the analysis card and the gate stay inside the column with no sideways scroll.

Mechanical defence passed: app typecheck, build, 301 tests, bundle, tokens, literal grep, SSR link, `check:seo --built`, `test:seo`. Multiplayer check: 34/34.

## Deviations

- The first row shows the error rate ("Wrong") rather than "Right", after the fresh-eyes look (「用户的错误率」).
- The gate line drops "stats" and says "get better" instead (「帮助用户提高，文字要精简」).
- Causes with a count of 0 are not shown.

## Environment

- Ports: web 55150, multiplayer 56150, database 57150.
- No env keys changed.
- A new table, `bidding_answers`, is created by the multiplayer service at start (`CREATE TABLE IF NOT EXISTS`).

## Residual

None.

## Check

1. The mistake list: small numbered buttons at the foot of the card, with no ✗ and no count of how often each was wrong.
2. The analysis rows: Wrong / Overbid / Underbid, with the causes in slate under each.
3. The gate line: "Save your mistakes and get better."
4. In the screenshots the header still shows "Sign in" while signed in. That is the local test account; a real Gmail login shows your avatar.

## Decided for you

- "The wrong game" is counted under overbid or underbid, and only first answers count (both approved with 「开始开发」).
- A plain table, no ratio bar.
- No extra "sign in to save" line beside a guest's analysis.
- Mistakes are numbered buttons that open the question in place.
- Question ids are `<deal>-<seat>`.
- The card is hidden until the first answer.
