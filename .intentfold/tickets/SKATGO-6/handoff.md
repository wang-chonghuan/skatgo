# SKATGO-6 handoff — 让第 4 课前两节讲解能看懂

## What changed

- Lesson 4 steps 1–2 rewritten in `app/src/lib/skat/lessons/content.{zh,en,de}.ts`:
  - **跟牌 / Following suit / Bedienen** — defines 首出 (lead) and 跟牌 (follow) in the sentence that
    uses them, states the rule, then shows it on cards: clubs trumps, ♥A led, hand ♥10 ♥7 ♠K ♦9 judged
    ✓ ✓ ✗ ✗; a second row for the void case captioned 毙 / 垫 / 垫 (trump / throw off; stechen /
    abwerfen), with 毙 and 垫 defined in the tip.
  - **J 算主牌 / A Jack is a trump / Ein Bube ist Trumpf** — recalls lesson 3, then the same hand
    (♣J ♣7 ♥9 ♦K, hearts trumps) twice: ♣A led → ✗ ✓ ✗ ✗; ♥A led → ✓ ✗ ✓ ✗.
- `lessons/types.ts`: `CardRow.follow = { contract, lead }`; `components/skat/card-row.tsx` then captions
  each card ✓/✗ from `legalPlays` in the course's good/bad colours — the engine judges, not the lesson.
- `lessons.test.ts`: parity now compares `follow`; every follow picture must show allowed and refused
  cards and must not contain its own lead.

## AC results

Built server on port 55006, headed Playwright, `tmp/ac.mjs` (uncommitted); lessons 1–3 marked done via
the product's progress key. Basic function only (no games).

1. **Terms explained where used — pass** (zh/en/de): the defining sentences for lead, follow, trump
   (毙/stechen) and throw off (垫/abwerfen) are on the two pages; 主牌, 花色, 墩 and "Jacks are trumps"
   were taught in lessons 1–3.
2. **Card pictures — pass** (zh/en/de × desktop/phone): step 1 reads ✓✓✗✗ + 毙垫垫, step 2 reads
   ✗✓✗✗ and ✓✗✓✗, as produced by the engine.
3. **Three languages, exercises unchanged — pass**: lesson 4 opens in each; the following play exercise
   still refuses ♣J and accepts ♣7; no horizontal scroll at 375px; no console errors. Mechanical
   defence (typecheck, build, 53 tests, client-bundle check, grep = 1, SSR link) passes.
4. **The user confirms it reads well — not verified.** Needs the human; left to them.

## Deviations

- The ticket asked to find out in the grill what exactly was unclear; by the human's instruction of the
  same day (no questions) that was judged from the text instead — see `grill.md`.

## Environment

Ports: web 55006. No env keys added, changed or removed.

## Residual

- AC4 for the human: read lesson 4's first two steps.
