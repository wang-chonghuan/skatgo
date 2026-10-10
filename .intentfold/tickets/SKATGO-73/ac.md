# SKATGO-73 acceptance check plan

Free play on the built product, driven by scripted legal moves (`tmp/speed.mjs`).

## 1. A tapped legal card is on the table at once
- Check: tap a legal card in the hand; time until that card is in the frame.
- Met when: under 0.3 s every time.

## 2. One tap on a hand card while a won trick waits
- Check: while a finished trick waits for its tap and the learner is on lead next, tap a hand card.
- Met when: the trick is collected and that card is in the frame, from that one tap.
