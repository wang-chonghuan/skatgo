# SKATGO-34 rework

## Round 1: the table's responsive layout

The human compared a 1000×487 screen with Funbridge's: 「到处都是遮挡和溢出」. They asked to keep the side
panel pinned on wide screens so it sizes the play area, to learn Funbridge's whole responsive logic, and
to do it in this ticket.

- Cause: the felt was absolutely placed in fixed px (frame 306, cards 120, stacks, the hand) around a 50%
  centre line. A short screen ran the board, the words, the frame, the stacks and the hand into each other.
- The stage (`theme/table.stylex.ts`), after Funbridge:
  - The felt is a size container.
  - One unit `u` fits a design stage under a fixed band for words: landscape is 1000×520u, portrait
    400×440u.
  - Cards, frame, stacks, edge tabs and the drawer's place are all in `u`, so the table scales as one.
  - Spare height is split around the frame. Things only move apart.
  - The hand runs about a third of a card off the bottom in landscape, as Funbridge's does.
- Band: the info board (one row of four in landscape, 2×2 in portrait). Under it is a line for the play
  words, which used to sit over the frame and overlapped the board.
- Side panel:
  - Pinned in the grid from 900px (`bp.pinned`, `clamp(280px, 28vw, 400px)`), so the felt takes the
    rest. Narrower, it is the drawer as before.
  - It can still be folded at any width (SKATGO-29). The fold tab sits on the felt's right edge,
    mirroring the hint tab.
  - Its tab row leaves room for the assistant's launcher.
- Moves: with the panel pinned open, Reizen, the skat, the discard and the contract are made in the panel,
  as Funbridge's bidding box is. Nothing lies over the table. Otherwise they use the drawer as before.
  Opponents' last bids moved to the frame's top corners, clear of the drawer.
- Trick: a side card keeps at least 18px from its frame edge, clear of the seat plate when the frame is
  small.
- Removed tokens: the dead fixed table dims.

### Checks (`tmp/layout.mjs`, `tmp/declare.mjs`, `tmp/fold.mjs`, `tmp/opp.mjs`)

- Overlap of the board, words, frame, both stacks, hand cards, hint tab, panel tab and the learner's
  plate, in play, with no page scroll:
  - 1000×487, 1440×900 and 1280×720: pinned panel, none.
  - 820×600 and 768×1024: none.
  - 390×844, 844×390 and 667×375: none.
- Bidding, discard and declare at 1000×487 are made in the panel. The contracts are in 2 columns and the
  panel scrolls.
- Phone: the drawer sits above the hand.
- Folding the panel at 1000×487 gives the felt the full width, and the tab follows the edge.
- The card flight still starts from the hand at opacity 1, and opponents' cards from their sides.
- Mechanical defence: all pass.

## Round 2: the whole hand

The human: 「我这么长的屏幕你也截断了，我看要不然都不截断吧，试试看」.

- The hand sits on the felt's bottom edge with every card whole (`handBottom` 0).
- The stage grows to hold it: landscape 1000×576u, portrait 400×464u. The edge tabs and the drawer sit
  above the full card.
- To keep the stacks clear of the hint tab on a phone in landscape, they are smaller there: card 100u,
  12u steps, centre 45u above the frame's.
- Checks (`tmp/layout.mjs`): no overlap and no page scroll at 1000×487, 1440×900, 1280×720, 820×600,
  768×1024, 390×844, 430×932, 844×390 and 667×375. At 1000×487 the card is now 78px wide (it was 87).
