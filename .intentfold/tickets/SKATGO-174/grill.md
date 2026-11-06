# SKATGO-174 grill

No question passes the bar: the wording is shown, not asked, and the live update is a mechanism the human's words
settle (「最好不用刷新」).

## Decided for you
1. **How the board stays current?** Ask again every 15 s while the page is visible, and at once when it comes back
   into view; a hidden page does not ask. Basis: the board is already computed on request and each deal is written
   when it ends, so asking often is the whole change; a push channel (socket/SSE) would be new machinery on the
   multiplayer service for a board read by a handful of players. 15 s keeps the AC's 20 s with room and costs one
   small request per open page per 15 s.
2. **Which sentence?** Only `xp_how_week`, EN and DE (the human pointed at it; copy edits only where pointed).
   EN: "🔥 days in a row with at least one deal. Signed-in players only; XP starts at 0 every Monday, the streak carries on."
   DE: "🔥 Tage in Folge mit mindestens einem Spiel. Nur angemeldete Spieler; die XP beginnen jeden Montag bei 0, die Serie läuft weiter." (Shortened after the look through the human's eyes: the contrast sits beside the Monday reset.)
3. **The server render's minute cache stays.** The browser asks again on mount, so the cached first paint is replaced at once.
