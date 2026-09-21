# SKATGO-2 handoff — 修正第 2 课牌点口诀的突兀文案

## What changed

The `tip` of lesson 2's first step ("只有五种牌有点数" / "Only five kinds of card score" /
"Nur fünf Kartenwerte zählen") in `app/src/lib/skat/lessons/content.{zh,en,de}.ts` — one line each,
wording chosen by the human in the grill:

- zh：口诀：A、10、K、Q、J 依次是 **11、10、4、3、2**。每门花色都有这五张，加起来 30 点；四门花色一共 **120** 点，就是第 1 课说的全副牌 120 点。
- en：Memorise: A, 10, K, Q, J are worth **11, 10, 4, 3, 2**. Every suit has these five cards, adding up to 30 points; four suits make **120** — the 120 points of the whole deck from lesson 1.
- de：Merke: A, 10, K, D, B zählen **11, 10, 4, 3, 2**. Jede Farbe hat diese fünf Karten, zusammen 30 Augen; vier Farben ergeben **120** – die 120 Augen des ganzen Blatts aus Lektion 1.

## AC results

Built server on port 55002, headed Playwright, `tmp/ac.mjs` (uncommitted); lesson 1 marked done through
the product's own progress key so lesson 2 opens.

1. **zh — pass.** Lesson 2 step 1 shows the new tip; 「一门花色 30 点」 is gone.
2. **en / de — pass.** The same step shows the new English / German tip, old sentence gone, no Chinese
   on either page; no console errors in any language.
3. **Nothing else moved — pass.** Diff against base `9085983` touches only the three `tip` lines plus
   this ticket's files. Mechanical defence (typecheck, build, 47 tests, client-bundle check, grep = 1,
   SSR link) passes.

## Deviations

None.

## Environment

Ports: web 55002. No env keys added, changed or removed.

## Residual

None from this ticket. The human asked to wait for further instructions after this fix.
