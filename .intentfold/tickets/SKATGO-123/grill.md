# SKATGO-123 grill

No question passed the bar: each is settled by the ticket's Request and Proposed solution, by the charter,
or is a look the human judges on screen. Development starts without a stop.

## Decided for you

1. **Is today counted while it runs?** No: a day counts once it has ended (Berlin), when its whole field is
   known — the Proposed solution's rule 7. Basis: the ticket.
2. **How are the human's merges kept?** A `player_aliases` table in the service's database (a player id and
   the id it is the same person as); production's two rows are written at close. Basis: engineering Redline
   1 forbids player ids in code, fixtures or ticket files.
3. **Which name stands for a merged player?** The current name of the id the others point to: the account
   for Mark, the latest guest id ("Julien") for Julien. Basis: the ticket's list.
4. **Two entries of one merged player on the same day?** The earlier finish counts. None exists now. Basis:
   one entry per player per day (product.md).
5. **A day without the KI's total?** The players play only each other; a player alone that day has no game.
   Basis: the rule needs an opponent; every production day has the KI's total.
6. **How many rows?** Ten, the KI's row beside them as on the daily board (not ranked, placed by its value).
   Basis: the list has ten; the daily board already shows the AI this way. A look — shown, not asked.
7. **Provisional?** The number with a "?", and the fold says what it means. Basis: the ticket's list.
8. **Phone and tablet?** Below `bp.cards` one column, the board under the text; on a phone (`bp.phone`) the
   board folded behind one line with the leader, a tap opens it. Basis: the human — 「手机上可能要折叠一下排名榜」.
   A look — shown, not asked.
9. **The hero's text on PC?** Left-aligned in its column: centred text beside a table reads as two
   unrelated blocks. A look — shown, not asked.
10. **How does a visitor learn the rule?** One line under the board's title, and a fold with the five
    numbers (start, KI, K, provisional, formula). Basis: the human wants it understood
    (「别人看了，觉得不离谱，觉得能理解」). Wording — shown, not asked.
11. **Inactive players?** Stay on the list with their number: absence costs nothing (rule 6).
12. **The preview of today's change right after playing (rule 7's second half)?** Not built: the
    acceptance criteria do not ask for it, and the daily page is not part of this ticket.
