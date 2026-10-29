# SKATGO-149 acceptance checks

Run against the ticket's web (55149) and multiplayer (56149), built.

1. **Fourth colour tile is the bidding practice.** Playwright on `/en` and `/de` at 1280×820: the fourth
   `entry-card` in `entry-sections` reads "Bidding practice" / "Reizen üben"; clicking it lands on
   `/en/bidding-practice` with the page's H1. True when both languages pass.
2. **Practice picture card after the forum.** Playwright on `/en`: in `entry-more`, the card after
   `data-section="forum"` is `data-section="tricks"`, its image `/practice-card.webp` loads (naturalWidth > 0), and
   clicking it lands on `/en/skat-tricks`.
3. **A question asks only the bid and explains.** Playwright on `/en/bidding-practice` as a guest: ten cards, a
   position line, four options (Pass and numbers); choosing one shows right/wrong, the AI's answer and the
   explanation with a calculation ("× base = value") or the pass reason; no other step (no play, no discard).
4. **Answers equal SkatZero's.** `npm test` in `multiplayer/` — the bidding-practice test re-reads the pool and
   checks every stored question's cards, position and answer against its deal's seat. True when it passes.
5. **Guest gets two questions.** Playwright, fresh browser: answer question 1, next, answer question 2, next →
   question 3 shows the sign-in gate and no options. (Signed-in continuation checked by the account path in code
   and, if a session is at hand, by the human's real login.)
6. **No overlap or overflow.** Playwright at 375×812 and 1280×820 on `/en` and `/en/bidding-practice` (after an
   answer): no horizontal scroll (`scrollWidth <= clientWidth`), the ten cards and the options inside the card's
   box, the three picture cards' boxes not intersecting.
