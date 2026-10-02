# SKATGO-41 acceptance checks

**Setup (local only):** web 55041, multiplayer 56041, PostgreSQL 57041. Script:
`tmp/paint-trace.mjs`.

**Measurement:** the ticket's method in headless Chromium.
- Phone 390×844, 3× pixels, touch, CPU slowed 4×.
- One trace runs from the click on the learner's card until the learner's next card (at least 2.7 s).
  This window holds the learner's flight, the hand closing up, both opponents' cards and the trick
  being collected.
- **Raster** is counted over the first 2.7 s.
- **A felt repaint** is a `Paint` event of the element that carries the felt's background (gradient
  and noise), found in the trace by its DOM node (grill Q2). Before the fix that is `skat-felt`; after
  it, the backdrop `skat-felt-bg`. Paints of other layers do not count, however large their clip.
  Raster ms is the headline number.

**Baseline:** this branch's base (`2e8807b`) built beside the fix (web 55141, inside the web block) and
measured with the same script, base and fix interleaved, eight runs each; medians compared.

## AC1 — the learner's card: raster ≤ 1/3, no felt repaint

- Median raster ms in the first 2.7 s after the fix ≤ 1/3 of the baseline's median. Every run is
  recorded; the ticket's reference is ≈ 120 ms.
- The threshold was 1/5. On 2026-10-02 the human relaxed it to 1/3, choosing sharp cards (AC3) over
  the lower raster (ticket comment). Sharp cards cost one repaint of each card once it lands.
- Zero felt repaints in that window.

## AC2 — opponents' cards and trick collection

- Zero felt repaints between the end of the learner's flight and the learner's next card.

## AC3 — looks the same, sharp at rest

- `constants.ts` and every `transition` / `initial` / `animate` / `exit` value are unchanged. This is
  checked in the diff.
- At rest after each flight (the learner's card in the trick, an opponent's card, the hand after it
  closes up), a 3× screenshot of the card is compared with the same card at base.
- Pass: the same sharpness, judged by eye on the zoomed crops plus a pixel difference that shows no
  blur ring.

## AC4 — all three tables

- Free play (`/en/play`): AC1–AC3.
- Lesson 11's game (`/en/course/ready-for-a-real-game`) and the tournament (`/en/daily/play`): one
  learner's-card trace each (raster and felt repaints) and a look at the table (grill Q4).
- Every UI change is checked at desktop 1280×820 and phone 375×812 (ui.md): the table renders as
  before, with the felt's grain and gradient intact.

## Left to the human (grill Q5)

How it feels on a real phone (iPhone Safari / Android Chrome) is the human's to check, after handoff or
deploy. It is not recorded as passed here.
