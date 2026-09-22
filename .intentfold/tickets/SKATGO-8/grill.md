# SKATGO-8 grill (self-adjudicated — the human's instruction of 2026-09-22: 「你自己回答grill问题，不许问我」)

Sources: charter and the code as observed (plan.md).

1. **Skat or Hand — what does the hint say?** The ticket binds the hint to the computers' logic, and
   the computers always pick up. Decision: the hint always recommends picking up, with the reason (the
   skat improves most hands by about a card — the tuning note in `ai.ts` — and lets you put two cards
   away), and adds, from the same plans, whether the hand would already cover the bid as a Hand game
   and at what value, so the learner sees what Hand would risk. No new strategy is invented.
2. **Announcements?** The computers never announce. Decision: the declare hint recommends a plain game
   and says why (an announcement is lost unless fulfilled). Null Ouvert likewise not recommended.
3. **Declare hint after picking up vs after Hand.** Both get the button. After pickup the advice ranks
   contracts for the ten kept, valued over those ten plus the two discards (the declarer's cards);
   after Hand it values over the ten dealt, like the picker already does, and says the skat may still
   change the matadors.
4. **When nothing covers the bid.** The rank already prefers covering contracts; if none does, the
   hint names the best remaining one and says plainly that it is an overbid.
5. **Home: what happens to "完成课数、对局战绩" (the one question the ticket reserved for the human).**
   Decision: keep the note line ("已完成 3 / 11 课 · 对局 2 场，赢 1 场") under the free-play button. The
   percentage and bar go (that is what the human asked to replace); the count still tells where the
   learner is, and the lesson cards show each lesson's state. Nothing is lost that the page does not
   show elsewhere.
6. **Order in the panel.** Free-play button where the bar was (top), then the note, then the resume
   button — the bar's position, as asked; "开始 / 继续" kept. Tones: free play `felt` (the tone the old
   section used), resume `primary` — brass stays the one call to action (ui.md "brass for the one call
   to action").
7. **Button label.** A standalone label must say what it opens: 「🃏 自由对局 · 开一桌」 /
   "🃏 Free play · open a table" / "🃏 Freies Spiel · an den Tisch" (one new message; the old section's
   `free_note` and `home_progress` become unused and are removed).
8. **Charter.** No token, no dependency, kit components only; `ai.ts` is a hotspot — behaviour of the
   computers must not change: `chooseDeclaration` keeps its exact rank (shared function), and the
   engine tests (300 whole games) must still pass.

9. **Found while building: the declare hint could contradict the discard hint.** The computers choose
   discard and contract together, each contract with its own best discard; ranking contracts on the ten
   the learner kept can name another contract even when the learner followed the discard hint (seen on
   a test deal). Decision: when the learner kept exactly what the computers keep, the declare hint is
   their contract; otherwise the same ranking on the cards actually kept. The unit test holds the first
   case over 400 deals (it failed before this decision, passes after).

10. **Found in the acceptance read-through: a weak game recommended with praise.** With a reckless bid
    the ranking (covering the bid first) can pick e.g. Grand with no Jacks. That is the computers' own
    choice, so it stays; the hint now says so plainly when the plan is below the computers' "worth
    playing" bar (score ≥ 1), and points to the bidding hint. Also: counts in en/de written as
    "Jacks: 1" so no plural is wrong; zh sentences joined without stray spaces.
