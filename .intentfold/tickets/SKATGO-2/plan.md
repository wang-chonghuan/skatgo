# SKATGO-2 plan

## What the code says that the ticket does not

- The sentence is the `tip` of lesson 2's first teach step ("只有五种牌有点数"), in
  `app/src/lib/skat/lessons/content.{zh,en,de}.ts` — one line in each. The step's body gives the five
  scoring ranks, the card row under it captions each card with its value; the tip then jumps to a
  per-suit total that nothing on the page has built up. Lesson 1 already said the deck holds 120.
- "花色 / suit / Farbe" itself is known from lesson 1; what is missing is where 30 comes from.
- Content only: no message catalogue, engine or test depends on this string. The parity test compares
  only whether a tip exists, so it is unaffected.

## Route

Rewrite the one `tip` string in each of the three content files so the 30 is derived in the sentence
(A+10+K+Q+J of one suit) and the 120 is tied back to lesson 1. Wording agreed in the grill.
