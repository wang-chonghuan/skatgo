# SKATGO-68 AC check plan

Local web 55068, multiplayer 56068, database 57068. Headed Playwright at desktop 1280×820, phone portrait 375×812 and phone landscape 812×375 (`isMobile`, `hasTouch`). Free play is driven to a full trick by scripted legal moves (pass, first legal card).

1. **Same size as the hand.** With three cards in the trick, each trick card's rendered width and height equal a hand card's (±1 px), at all three sizes.
2. **Every card's index can be read; since rework 2, its whole top-left index (the number and the suit under it).** For each trick card, the centre and the four inner corners of that index, found with `elementFromPoint`, lie inside that card, whatever was played last. A screenshot is taken.
3. **Order shows.** The trick cards' stacking follows the play order: where two overlap, `elementFromPoint` in the overlap returns the later one.
4. **Nothing covered, nothing overflows.**
   - No trick card's box intersects a hand card or the info board. No trick card lies over a seat plate: at the plate's middle and inner corners no trick card is on top.
   - The page has no horizontal scroll.
   - The skat during bidding is hand-sized and inside the frame.

Mechanical defence per `engineering.md` Tools.
