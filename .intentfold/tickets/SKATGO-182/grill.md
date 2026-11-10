# SKATGO-182 grill

## Your decisions

1. **Can a row in the history be opened to see that deal's review (the AI's play, the biggest difference)?**
   Recommendation was: no, the summary only. **Answer: no review — a replay.** 「这么做，可以replay，不是复盘，就是让该人再打一盘，
   就如同正规的free play的replay，不计入任何分。但是呢，想点此处的复牌，必须登录。」 Each row can be played again with the same
   cards, counted nowhere, as free play's replay; replaying needs an account.

## Decided for you

2. **The guest id.** Reuse the deal of the day's device cookie, same name and value, path widened from `/api/daily` to
   `/api`; free play's review names it. Basis: the existing guest id and its no-consent-banner reasoning (the human,
   2026-10-01); renaming would lose existing guests. A browser that had the old cookie and finishes a free deal before
   it next touches the daily gets a second id for those deals until then — accepted, rare.
3. **How the merge works.** An alias (`player_aliases`) from the device's id to the account, written at sign-in, beside
   the existing move of today's entries. Basis: XP board and record of play already count aliases as one person; past
   boards must not change (ticket constraint, SKATGO-35).
4. **When the merge runs.** On the daily handler's `state`, `board`, `xp` and `profile` for a signed-in browser with the
   cookie. Basis: the front page asks `xp` and `profile` right after sign-in.
5. **A shared device after sign-out.** Signed out, the browser sees only the deals played as a guest, never the
   account's record or its weekly notes. Basis: the record is "the player's own: no one else sees it" (product.md).
6. **The entry.** The front page's existing My progress card (ticket comment). Guest with deals: the whole card links
   to `/profile` like the account's, lists the latest deals scrolling inside, one `slate` line that signing in keeps
   them; the sign-in button is on the page. Guest without deals: unchanged. Basis: 「点开」 opens the page; a button
   inside a link is not possible; shown in the handoff screenshots for the human to judge.
7. **The page's title** stays "Your Skat profile"; the history is a white card at the top: an account's folded behind
   "All your games (n)" and a chevron, as "Earlier weeks" is; a guest's open with its count. Basis: 「登录了就和当前一样」;
   the existing fold pattern.
8. **A row.** What happened from the player's seat (declared / defended a game, won or lost; all passed), the mode and
   day in `meta`, the two scores with `You`/`AI` tags, signed, never `good`/`bad`. Basis: `VsAiTable`'s rows,
   SKATGO-81.
9. **Long lists.** 20 rows, then `quiet` "Show more" for 20 more; the card shows the latest 20, scrolling. Basis: an
   account has hundreds of deals.
10. **Privacy text.** The cookie and free-play sentences updated in English and German. Basis: they would be false.
11. **The "you already have N XP, sign in" prompt** from the proposed solution: not built. Basis: the ticket says only
    if the human agrees; the human did not ask for it.
12. **Where a replay is played.** A new full-screen page, `/replay` (private, noindex), as the deal of the day's replay
    is (`/daily/replay`): free play's `/play` is not used, so its round and the game kept in the browser stay as they
    were. Its result offers the deal once more, and its close goes back to the profile. Basis: SKATGO-170/177's replay
    tables; the round must not change.
13. **Which deals replay.** Every row: a free deal from its pool deal, a deal of the day from its day, a deal of the six
    from its day and number. The service deals a free one or one of the six only to a player whose record has it; a
    past deal of the day is open as practice already (SKATGO-132). Basis: replay needs an account (Q1); nothing else
    may become a way to see a tournament's deals before playing them.
14. **The card has no replay.** On the front page the whole card is the link to the page; replay is on the page's rows.
    Basis: a control inside a link is not possible.
15. **A guest's tap on replay** opens Clerk's sign-in and the replay opens once signed in, as a guest's tap at a private
    table goes on (ui.md). Basis: Q1, 「必须登录」.
