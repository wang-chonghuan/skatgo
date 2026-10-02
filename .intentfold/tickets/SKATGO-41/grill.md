# SKATGO-41 grill

Grill: human when the batch was written; the human then authorized self-adjudication for this ticket
(2026-10-02, 「回答41的grill问题」; the ticket's Grill row is now `self`). Answers below are recorded by the
pm session under that authority, from the Charter and observation. No question needs a Redline approval.

## Q1 — Which browser measures, and against what baseline?

**Question.** The ticket's numbers (≈ 120 ms raster) come from a Chromium that rasterizes on the CPU.
Here, headless Chromium reproduces them: 98–155 ms and 298–333 tasks. Headed Chromium on this Mac
rasterizes on the GPU and reports only 5–8 ms, which is not comparable.

Should AC1 be measured in headless Chromium, against a baseline re-measured on this branch's base
with the same script (≤ 1/5 of that)?

**Recommendation.** Yes: headless Chromium, a local before/after on the same machine, and the
ticket's ≈ 120 ms quoted alongside.

**Reason.** Only a same-machine, same-browser comparison is fair. The local baseline already matches
the ticket's figure.

**Answer** (pm, self-adjudicated). **Accepted**: headless Chromium; same machine, before and after;
the baseline from this branch's base with the same script; the ticket's ≈ 120 ms quoted alongside.
The ticket's figures were taken in headless Playwright Chromium too, which is why they match.

## Q2 — What counts as "a full-screen felt repaint"?

**Question.** The trace shows `Paint` events with a clip rectangle. Should "the felt is repainted" mean
a paint covering ≥ 60 % of the screen (free play), or of the embedded felt (lesson 11)?

**Recommendation.** Yes, ≥ 60 %.

**Reason.**
- Before the fix almost every paint covers the whole felt: 72 of 72, 88 of 90.
- Small paints (a seat plate's text, the hand's own strip) are not the problem the ticket describes.
- 60 % separates the two cleanly.

**Answer** (pm, self-adjudicated). **Not the 60 % clip rule.** A felt repaint is a `Paint` of the
element that carries the felt's background (gradient + noise), identified in the trace by its node.
Raster ms stays the headline number.
- Observed (pm session, 2026-10-02, live site with the layer hints injected): raster fell from
  117–120 ms to 9–16 ms. Yet 45–53 paints with a full-screen clip remained: paints of the other, now
  nearly empty, layers.
- Under a ≥ 60 % clip rule, AC1 would fail a working fix.
- The ticket's wording, 「不再出现整屏牌桌背景的重绘」, is about the background, so the ticket stays
  as it is.
- `ac.md` is changed to match.

## Q3 — If a card ends up soft after its flight, what then?

**Question.** A layer hint can make Chrome keep a card's first raster scale. The learner's card flies
from hand size to trick size, and an opponent's card starts at 0.85, so a card could stay slightly
soft at rest. If that shows up, may I drop the hint from that card once its animation completes,
keeping the scale animation? Translate-only would change the look and is held back.

**Recommendation.** Yes: drop the hint when the animation completes. Translate-only only with your
agreement.

**Reason.**
- The ticket's constraint is "the animation itself does not change".
- Dropping the hint afterwards keeps the route, duration and scale exactly, and costs one raster at
  rest.

**Answer** (pm, self-adjudicated). **Accepted**: if a card rests soft, end its hint when its animation
completes, keeping route, duration and scale; one raster at rest is cheap. Translate-only stays
excluded unless the human agrees (ticket constraint: the animation itself does not change).

## Q4 — How much measuring on lesson 11 and the tournament?

**Question.** All three tables are the same `GameTable`.
- Free play gets the full measurement: AC1–AC3.
- Lesson 11 and the tournament would each get one learner's-card trace (raster and full-felt paints)
  plus a look at the table.
- No full games, and no separate opponent and trick traces there.

Is that enough?

**Recommendation.** Yes.

**Reason.**
- The change is in the shared component, and the server tables differ only in where moves come from.
- You asked for basic checks only ("基本可以就行了").
- One trace each still proves the hints apply there (embedded felt, server source).

**Answer** (pm, self-adjudicated). **Accepted**: free play gets AC1–AC3 in full, and lesson 11 and the
tournament get one learner's-card trace each plus a look. Basis: one shared `GameTable`, and the
human's standing rule that acceptance checks basic function only.

## Q5 — Real devices?

**Question.** The Proposed solution suggests a look on a real iPhone or Android "if possible". I
cannot drive a real phone; the iOS Simulator does not reflect GPU performance.

May the real-device look be yours, after handoff, on the ticket preview or after deploy?

**Recommendation.** Yes: the human checks on a phone. No simulator measurement.

**Reason.**
- A simulator's smoothness says nothing about a phone's.
- Your memory note already says gameplay feel is yours to test.

**Answer** (pm, self-adjudicated). **Accepted**: the real-phone look is the human's, after handoff or
deploy. No simulator measurement. The handoff says so plainly; it is not recorded as passed.

## Q6 — Also give the deal and the action drawer layers?

**Question.** The ticket names four animations: the learner's card, the hand closing up, opponents'
cards and trick collection. The deal into the hand (the same slots) and the action drawer rising also
move over the felt.

Give them the same hint, without separate criteria for them?

**Recommendation.** Yes. The slots get the hint anyway, and the drawer is one line.

**Reason.**
- Same cause, same fix.
- Leaving the drawer out would keep one full repaint each time it opens.

**Answer** (pm, self-adjudicated). **Accepted**: the deal into the hand and the action drawer get the
same hint, with no separate criteria. Same cause, same fix. CSS transform transitions (the drawer
panel's slide) are composited by the browser already and need nothing.

## Outcome

All six resolved, self-adjudicated under the human's authorization. Fold into `ac.md`:
- **Q2**: a felt repaint means a paint of the felt-background element, not a paint with a large clip.
- **Q5**: the real-device look is listed as left to the human.
Everything else stands as drafted.


## After the grill — AC1 relaxed (2026-10-02, the human)

During development, AC1 (raster ≤ 1/5) and AC3 (sharp at rest) turned out to conflict.
- A card that rests on the layer it flew in on keeps that layer's flight-time scale, and is slightly
  soft: edge contrast is about 30 % lower.
- Making it sharp means drawing it once more at its final size when it lands.

Medians of eight interleaved runs against base (98.85 ms):

| Variant | Raster | Ratio | At rest |
|---|---|---|---|
| Sharp | 26.5 ms | 0.27 | sharp |
| Soft | 13.75 ms | 0.14 | soft |

Felt repaints were 0 in both.

The human chose 「保清晰，放宽 AC1」: AC1 becomes ≤ 1/3. The live ticket and `ac.md` are updated, and a
ticket comment records it.
