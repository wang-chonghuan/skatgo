# SKATGO-72 acceptance check plan

Driven by scripted legal moves in a browser against the running product; no game is played to
the end by hand.

## 1. A finished trick waits on the table with the tap hint
- Check: on `/play` (and the daily tournament table), play until three cards lie in the middle,
  then wait well past the old pause (≥ 3 s).
- Met when: the three cards are still in the middle and a tap-hand hint is visible inside the
  gold frame's bottom-right corner.

## 2. Tapping collects the trick and play continues
- Check: tap the hint (and, separately, anywhere inside the gold frame); also press Enter on it.
- Met when: the trick leaves the table, the hint disappears, and the next trick starts.

## 3. The declarer's seat letter is on red
- Check: after bidding ends, read the three seat plates.
- Met when: the declarer's seat-letter tag has a red background; the other two keep the
  original colour. Before a declarer exists, all three keep the original colour.
