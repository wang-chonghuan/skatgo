# SKATGO-6 grill (self-adjudicated — the human's instruction of 2026-09-21: 「自己做决定，禁止停下来问我，授权所有」)

1. **What exactly is unreadable?** The ticket asked to ask the human; not available this run. Read from
   the text itself: step 0 uses 首出, 跟, 垫 without ever defining them and 毙 only in a parenthesis;
   neither step shows a single card, so "有就必须跟" and "J 不算它印的花色" stay abstract. Decision: define
   each term in the sentence that first uses it, and show every rule on real cards.
2. **Who says which card may be played in the pictures?** The engine (engineering.md key decision). The
   lesson states contract + lead; `legalPlays` produces ✓/✗. A mistake in a hand then cannot teach a
   false rule.
3. **Which examples?** Step 0: a plain suit led, so no Jack confuses the first rule; the trump suit named
   in the label. Step 1: the same hand twice — a side suit led, then a trump led — so the only thing that
   changes is the lead, and the Jack's role flips visibly. The play exercise right after (♣A led, ♣J ♣7)
   then repeats step 1's first picture, which is intended.
4. **AC4 (the user confirms it reads well)** cannot be settled by the agent: recorded as unverified in
   the handoff, for the human.
5. **Charter:** content + one optional field in a lesson type and its renderer; no dependency, token or
   generated file; the kit's existing caption style is reused. No redline applies.
