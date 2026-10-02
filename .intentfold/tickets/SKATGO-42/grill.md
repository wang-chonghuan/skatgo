# SKATGO-42 grill

Grill: human. The questions are drafted against `plan.md` and `ac.md`. Answers are recorded below each
question.

## Q1 — Longer day preparation

**Question.** Working out the computer in your seat adds seat 0's SkatZero bidding to every deal,
about +50 % preparation time.

| Where | Today | With this change |
|---|---|---|
| Production | 238 s per day (2026-10-02) | ≈ 6 min |
| Locally | ≈ 40 s | ≈ 1 min |

The limit is 10 min per day, and preparation runs ahead (today and tomorrow), never in a request.

Acceptable?

**Recommendation.** Yes.

**Reason.**
- Preparation already happens the day before, so players never wait on it.
- There is still margin under the 10-minute limit.

**Answer** (the human, 2026-10-02): agreed.

## Q2 — Days already prepared

**Question.** In production, today (2026-10-02) and tomorrow (2026-10-03) are already dealt, without
computer results. Should the service fill them in when it starts? It would add the result inside each
stored deal, change nothing else, and leave players' records untouched. The alternative is to show
"—" until the first day dealt after deploy.

**Recommendation.** Fill them in, so tomorrow already shows it.

**Reason.**
- It is the same preparation step, run once.
- No schema change, and no change to cards or entries already played.

**Answer** (the human, 2026-10-02): **re-deal today** instead of filling it in. The human chose
「整天重新发牌」 knowing that today's 12 deals and every player's entry for today are deleted (production
data, not recoverable).

Outcome:
- At deploy, a one-off step deletes the then-current day's `daily_deals` row and its `daily_entries`.
- Tomorrow's row is deleted too: nobody can have played it, so this changes nothing anyone has seen,
  and it replaces the fill-in.
- The leader then prepares both days anew, with the computer's results.
- No fill-in code is written. The exact days are confirmed with the human at deploy.

## Q3 — Keep the computer's moves?

**Question.** You said keeping the computer's moves is probably unnecessary. Showing contract,
declarer and score needs only the result.

Store the computer's whole move log anyway (about 1 KB per deal, not shown), so a later replay (e.g.
SKATGO-37's review) can show how the computer played?

**Recommendation.** Store it.

**Reason.**
- It cannot be recomputed identically later: model output differs slightly between machines
  (SKATGO-39).
- Storing it costs almost nothing.

**Answer** (the human, 2026-10-02): agreed — store the computer's move log, not shown.

## Q4 — Where the running table appears

**Question.** The table should appear:
- in the result box after each deal (agreed);
- on the day's result page after deal 12 (agreed);
- also on `/daily` while the day is under way, above "Continue: deal n of 12", so a reload shows it
  at once.

Add the third?

**Recommendation.** Yes.

**Reason.**
- Otherwise, after a reload the table only reappears once the next deal ends.

**Answer** (the human, 2026-10-02): agreed — `/daily` shows the running table while the day is under way.

## Q5 — Naming in the table

**Question.** When the computer in your seat is declarer, the table needs a name for it. Lina and
Max keep theirs. Should it say "Computer" (de "Computer")?

If the computer passed the deal in, the row would read "Passed in" with 0.

**Recommendation.** "Computer"; "Passed in" with 0.

**Reason.** It must not read as "You", because it is not your result.

**Answer** (the human, 2026-10-02): the computer in your seat is shown as **「AI」** (en and de: "AI"). Passed in reads "Passed in" with 0.

## Outcome

All resolved by the human on 2026-10-02. `plan.md` and `ac.md` are updated. Today and tomorrow are
re-dealt at deploy (Q2); no fill-in code is written.
