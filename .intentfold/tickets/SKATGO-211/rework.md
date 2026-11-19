# SKATGO-211 rework

Relative to the frozen handoff (451b5e4). One round.

## Round 1 — 96b0708
Ask: 「你管人家陪练呢，如果ai拟人以后真的打了liga，就算分，现在没打，都铜牌，你不要特殊处理，不要给我加约束」
- The XP board's badge is worded and tested as the one rule it is: the person's own League tier, Bronze without one. The
  persona-specific test case (a Legend-band persona Bronze) and the mentions of personas in the comment and charter ui.md
  are gone. The code was already the one rule; behaviour unchanged.
- The grill's "Every persona is Bronze, whatever strength" is withdrawn by this ask: there is no rule of the AI players'
  own. If they come to play the League and have a standing, it shows.
- Rechecked: the XP test.

## Net effect
The handoff's fix stands as one rule for everyone. No env key changed.
