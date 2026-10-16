# SKATGO-108 grill — batch 1 (written before asking)

## Q1 Should the ladder remember what was solved?
- Recommendation: yes, in the browser only (like the course's progress): solved steps get a check and the card shows "3 / 10"; no sign-in.
- Why: a ladder without progress is a list; SKATGO-103 chose "nothing saved" for the plain exercises — this would be the first exercise progress.
- Decision: pending

## Q2 Locked steps or open?
- Recommendation: open — all ten playable in any order, the next unsolved one marked.
- Why: with ten puzzles a lock mostly blocks; the order already carries the climb.
- Decision: pending

## Q3 The levels across ten steps
- Recommendation: steps 1–3 level 1 (outstanding cards and voids listed), 4–7 level 2 (play record only), 8–10 level 3 (also count the points yourself); tricks left rising 3 → 5.
- Decision: pending

## Q4 How the analysis is written
- Recommendation: generated from the solver's facts with fixed sentence templates in German and English — the voids and what follows, the opponents' cards, the line with points per trick, each trap with the split that beats it. No hand-written prose per puzzle, so a thousand puzzles read as well as ten.
- Decision: pending

## Q5 The existing open-card kind 8 "Endspiel mit offenen Karten" (3 exercises)
- Recommendation: keep it as it is; the ladder is the closed-card series.
- Alternative: remove it, since you said 「不做有明牌的」 — the hub would then show the ladder plus eleven kinds.
- Decision: pending

## Q6 The ladder card's look
- Recommendation: the same white card as the twelve kinds but featured (the deeper shadow and a `go` border), titled "Sieg sichern" / "Lock in the win" with the line "Skat-Endspiele wie Schachaufgaben: eine Karte gewinnt sicher" and the progress; opened, the ten steps as rows with a level badge and "noch 3 Stiche".
- Decision: pending

## Answers (the human, 2026-10-17)

> 都同意，开始开发，然后直接部署

- Q1–Q6: as recommended.
- Finish for this run: auto-deploy (「直接部署」); the ticket's Meta row says review.
