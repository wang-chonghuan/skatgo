# SKATGO-32 plan

- The info board's first cell carries a second line, "Bidding" or "Waiting for the game to be announced".
  The latter does not fit a phone cell, and the table's running line already says the same thing ("Max is
  looking at the skat…").
- Hints and refusals live in the running-words stack over the frame (on a phone, just above the hand, which
  covers them) and inside the action drawer.
- Route:
  - The first cell keeps only "Bidding".
  - A new top container holds the board and, right under it, a message area. It carries the refusal and
    the hint as `Message` panels, each with a close button (`message_close`).
  - Hints and refusals leave the words stack and the drawer.
- Found while checking: the felt's `overflow: hidden` could still be scrolled by focus or `scrollIntoView`,
  which slid the table 83px sideways on a phone. Table and felt become `overflow: clip`.
- Redlines: no token change, no dependency.
