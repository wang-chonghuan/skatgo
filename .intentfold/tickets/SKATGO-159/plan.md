# SKATGO-159 plan

## What the code already promises, and what the ticket does not say

- The questions are generated once (`multiplayer/scripts/make-bidding-practice.ts`) from free play's pool: 1,000 deals,
  3,000 seats, each with SkatZero's highest bid (`maxBid`). The browser runs no SkatZero.
- SKATGO-149 kept only hands whose highest bid equals one game's ten-card value; SKATGO-154 added that SkatZero plays
  that game in ≥ 60% of skats *and* that it is the suit with most trumps. Together these leave only hands the routine
  answers: in today's 600, every suit answer is the longest suit, and the Buben count separates pass from play.
- Survey of the pool: 1,572 seats bid. 566 bid away from every single ten-card value (175 above, 248 below the
  best suit's value, 143 otherwise); 113 seats the rules of thumb would bid are passed by SkatZero, 419 SkatZero bids
  are passes by the rules of thumb.
- Question ids are `deal-seat`; an account's answers are rows in `bidding_answers`, a guest's in localStorage
  (`skatgo.bidding.v1`), the place in the run in localStorage (`skatgo.bidding-practice`).
- Undecided by the ticket: the exact number of questions (the qualifying hands decide), how "how far" is asked, and
  how SkatZero's numbers are said.

## Route

1. **SkatZero analysis** (`seatGames`, beside the port): also return, per suit game and Grand, the chance it is made
   at each bid over the same skats — won within the twelve cards' value, Schneider/Schwarz above it, never beyond.
   `bidding-practice-games.ts` runs it for every seat SkatZero bids (at its highest bid) and every seat the rules of
   thumb would bid (at 18).
2. **The routine** (`routineOf` in `practice.ts`): the suit with most trumps; play with ≥ 6 trumps, 5 and a side Ace,
   or 2 Buben and 2 Aces; bid its ten-card value. A question's difficulty is how many of its two steps the routine
   gets wrong (0 basic, 1, 2).
3. **Questions** (`Practice`): the contract is stored (SkatZero's own, ≥ 60% of skats, picked up; a Null by its kind),
   no longer derived from the bid; step 2's options are stored; with them the chance SkatZero makes its contract at
   each option, and each game's chance at the reference bid (the bid, or 18 for a pass). A bid away from the ten-card
   value is a question when the chances back it: high enough at the bid, clearly lower above it.
   About 150 questions: basic ≤ ¼ and first, then one step wrong, then both.
4. **Explanation**: today's lines stay (trumps per suit, the rule met, the count); new lines say where the routine
   fails — the routine's verdict next to SkatZero's chance — and, for the bid, the chance at each offered number
   ("24: 92% · 36: 71% · 48: 38%"). The cheat sheet's "How high can you bid?" gains one point: the skat can change the
   value. The "the explanation never shows SkatZero's numbers" rule (product.md, SKATGO-149) is amended.
5. **Records**: ids become `v2-deal-seat`; the multiplayer service deletes every older `bidding_answers` row at
   start; the browser's keys move to v2 and the old ones are removed. SKATGO-150's legacy `first` reading goes.
6. Tests (app and multiplayer) for the new rules; charter product.md / engineering.md.
