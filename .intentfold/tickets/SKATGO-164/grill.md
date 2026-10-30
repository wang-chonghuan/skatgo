# SKATGO-164 grill

Grill: human. Questions considered against the bar (`references/common/grill.md`). None reached the human: the request
("和free play的体验一样") settles each.

1. **The room's beat.**
   - Options: exactly free play's 850 ms, or only "slower than now".
   - Decided: exactly 850 ms, since the request asks for free play's experience.
   - The default changes; `AI_DELAY_MS` still overrides it.
2. **Pacing in the browser as well as at the server.**
   - Decided: both.
   - The server's beat keeps a deal watched by a newcomer at the same pace for everyone.
   - The page's pacing covers what arrives in a burst: behind a held trick, after a reconnection.
3. **A computer's skat step, three moves or one.**
   - Decided: three states, one per beat, as free play shows them.
   - The computer decides each step again from the same cards, through the code path that stands in for an away person.
4. **The jitter fix.**
   - Decided: a move counts as sent until its state arrives. Nothing else replaces the table meanwhile.
   - Ruled out: matching the pending card by content inside `GameTable`. It touches every server table for a room-only cause.
