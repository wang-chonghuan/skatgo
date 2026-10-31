# SKATGO-166 acceptance checks

Private room on the ticket's local services (one person, two computer seats, the person's seat stood in for by a
computer after the 30 s grace so no game is played by the check), headed Playwright, 1280×820 and 375×812, en and de.

1. Box: `[data-testid=skat-result-card]` is tinted (good/bad); its text is exactly the headline and one reason line
   (two children). Headline names the declarer, the game and won/lost.
2. Score table: three columns in the board's order with the board's names; "This deal" equals the deal's
   Seeger-Fabian scores (`data-deal`), "Total" equals the board's totals cell.
3. No repetition: in the dialog's text the deal's score values appear only in the table; the card points only in the
   reason line; the skat cards only once; no "This game:" / "Total:" lines.
4. Type levels: every text node's computed (font-size, font-weight) in the dialog, card faces excluded — at most 4
   distinct pairs.
5. Against the AI: not reachable without playing a deal (no scripted games); checked by unit tests of the after-deal
   rules and typecheck; the look is left to the human's own deal in free play.
6. Passed-in: reachable in a room only by chance; checked if it comes up, otherwise by the same component path.
7. No horizontal scroll in the dialog at 375 and 1280, no page errors, en and de.
