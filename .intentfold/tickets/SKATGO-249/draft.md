# SKATGO-249 draft — agreed in the conversation before the ticket

The human asked for a progress bar on each hard-hands card and to discuss a roguelike; the agent proposed both, the
human chose: 「先做每类的进度吧，要个bar。rouguelike的先不做」. This replaces the grill (the one alignment slot).

## Agreed approach
- A deal is passed when the player won it, or lost it while SkatZero's own run of the same cards with the same game
  lost too ("not worse than the AI"). Passed stays passed.
- Each card says how many of its 30 are passed, with a bar; the card opens the first deal not yet passed (all passed: 1).
- Kept as the Skat Tricks ladder keeps its record: an account's on the server, a guest's in this browser, merged into the
  account at the first look once signed in.

## Ruled out
- The roguelike run (floors, lives, perks, weekly seed) — later, its own ticket.
- Counting by wins alone: the hardest deals lose about half the time even played well; the bar would measure luck.

## Premises probed
- Challenge play is stateless (sealed tokens, multiplayer/src/challenge.ts); the review already plays SkatZero's run of
  the same deal, so the pass is decided there on the server with no extra AI work.
- The web challenge handler passes no identity today; the tricks handler shows how a signed-in player is named
  (`signedInUser`, never the browser's word).
