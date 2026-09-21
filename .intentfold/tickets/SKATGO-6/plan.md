# SKATGO-6 plan

## What the code says that the ticket does not

- Lesson 4's first two steps (`content.{zh,en,de}.ts`, lesson id '4', steps 0–1) are text only. Step 0
  uses 首出 / 跟 / 毙 / 垫 (lead / follow / trump / throw off) — 首出, 跟, 垫 are never explained before
  or there; 毙 is glossed in passing. Step 1 leans on lesson 3's "Jacks are trumps" and states the
  consequence abstractly, with no cards.
- Lessons 1–3 taught: 墩, 花色, 主牌, 四张 J 永远是主牌. That is the ground to build on.
- `TeachStep.rows` can show cards with captions (`CardRowView`), but captions are hand-typed text.
- engineering.md: "the rules engine is the only judge" — a picture that says which card may be played
  is a claim about the rules, so it must come from `legalPlays`, not from typed ✓/✗.

## Route

1. `CardRow` gains an optional `follow: { contract, lead }`. `CardRowView` then captions each card
   ✓ or ✗ from `legalPlays(row.cards, [lead], contract)` — the engine decides, the lesson only states
   the situation. No other renderer change.
2. Rewrite lesson 4 steps 0–1 in zh/en/de:
   - Step 0 "跟牌": define 首出 and 跟牌 with one sentence each; the rule; a worked example (clubs are
     trumps, ♥A led; hand ♥10 ♥7 ♠K ♦9 → engine-judged ✓✓✗✗); then the void case, defining 毙 and 垫
     with a second row (♣8 trump / ♠K ♦9) captioned 毙 / 垫 / 垫.
   - Step 1 "J 算主牌": recall lesson 3; the rule both ways; two engine-judged rows in a hearts game:
     ♣A led with ♣J ♣7 ♥9 ♦K (only ♣7), and ♥A led with the same hand (♣J and ♥9).
3. A unit test: every `follow` row's lead is not in the row and its contract is a real one — and the
   three languages carry the same rows (the existing parity test compares rows' cards and caption
   counts; it is extended to `follow`).
