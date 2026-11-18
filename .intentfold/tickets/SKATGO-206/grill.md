# SKATGO-206 grill

Grill: human. No question passed the bar: the board's content, order, row layout and place are the human's words in the
ticket; replacing the Legend board, the badges cut from the tier pictures and the first 100 with the own row after them
were put to the human when the ticket was filed and answered 「同意」 (2026-11-18). The rest is cheap to change in a
rework round or shown on screen.

## Recommendations you approved

1. **The total board replaces the Legend board.** Legend's accounts head it. (「同意」)
2. **The badge is each tier picture's own emblem**, cut out on the tier's colour — the same drawing. (「同意」)
3. **The first 100**, and the asker's own row after them when it is further down. (「同意」)

## Decided for you

4. **Who counts as having played.** An account seated at a League sitting that has at least one finished deal —
   SKATGO-204's round-scored deals included. Basis: Request 「只要打了一局的就要上榜」; the records show people never join a
   sitting midway, so the first seats played its first deal.
5. **Deleted accounts.** Not on the board: deletion (SKATGO-185) removes the name, and the board lists names. Basis:
   product.md, an account deleted takes what SkatGo holds under it.
6. **Ties.** Equal tier and points share the rank number, the next rank skipping as on the Legend and XP boards. Order
   within a tie is not meaningful (`updated_at` moves with every fee). Basis: the existing boards.
7. **Badge position.** Between the rank and the name. Basis: Request 「每个人名旁边……最左边是总排名」 puts the rank first and
   the badge next to the name; shown in the screenshots.
8. **Title.** "League ranking" / "Liga-Rangliste". Basis: the board now ranks the whole League; shown on screen.
9. **Nobody on it yet.** The board stays hidden, as the Legend board was while empty.
10. **Badge size.** `dims.badge` (24px), `radii.tag`; no new token (ui.md Redline 1 not touched).
11. **Cost.** The board is worked out on each `/league/state` from the sittings and their deals; the tables are small and
    `league_deals` is looked up by its key. No new column or table.
