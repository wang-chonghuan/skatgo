# SKATGO-8 handoff — 对局补齐提示；首页打牌入口替换进度条

## What changed

**Hints (game table)**
- `lib/skat/ai.ts`: the computers' contract ranking is one function (`rankOf`) shared by their own
  `chooseDeclaration` and two new advice functions:
  - `skatAdvice(ten, bid)` — always "pick up" (the computers always do), plus the best Hand game over
    the ten cards and whether it would cover the bid;
  - `declarationAdvice(ten, known, bid, hand)` — the game they would announce: their exact contract when
    the learner kept what they keep (so it never contradicts the discard hint), otherwise their ranking
    on the ten actually kept; never an announcement; `strong` = their "worth playing" bar.
- `components/skat/game-table.tsx`: 💡 buttons on the skat-choice row (「💡 拿还是不拿？」) and in the
  declare step (「💡 打什么？」), into the existing hint panel; the declare hint names the game and why
  (trumps/Aces, Jacks/Aces, or Null safety), whether it covers the bid, a plain warning when the hand is
  weak, and — in a Hand game — no announcement plus the existing "a Jack in the skat…" note.
- Messages added in zh/en/de.

**Course map**
- `components/skat/course-home.tsx`: the hero panel's percentage + progress bar are replaced by the
  free-play link (「🃏 自由对局 · 开一桌」, felt tone); the note (lessons done · games won) and the resume
  button stay; after graduating, the one button reads 「🎓 已毕业 · 去打牌」. The bottom free-play section is
  gone; `free_note`, `free_open`, `home_progress` removed from all catalogues.

**Tests** — `skat.test.ts`: over 400 deals the declare hint names the computers' contract when the
learner kept their ten (this test failed before grill point 9 and passes after); the skat hint always
picks up and values Hand over the ten. The existing 300 whole computer games still pass: the computers'
play is unchanged.

## AC results

Built server on port 55008, headed Playwright, `tmp/ac.mjs` (uncommitted). No card was played: the learner
only bids (without limit, which always wins the auction), per the user's rule.

1. **Skat hint — pass** (zh/en/de × desktop/phone): at the skat choice the 💡 button shows a reasoned
   recommendation (pick up; what Hand would be worth against the bid).
2. **Declare hint, both paths — pass** (zh/en/de × desktop/phone): after pick-up + discard, and after
   Hand, the 💡 button shows the recommended game, its reason, whether it covers the bid, and for Hand the
   no-announcement advice.
3. **Home — pass** (zh/en/de × desktop/phone): the free-play link is the first element of the hero panel
   and opens the table; exactly one link to the table on the page; no progress bar; note and resume link
   present; no horizontal scroll.
- No console errors in any run. Mechanical defence (typecheck, build, 55 tests, client-bundle check,
  grep = 1, SSR link) passes.
- Not claimed: whether following the hints wins games — gameplay is the user's to test.

## Deviations

- Grill self-adjudicated at the human's instruction (ticket comment); the question the ticket reserved
  for the human (what happens to the lesson count and game record) decided in grill point 5.
- Two findings during the work changed the design (grill points 9 and 10).

## Environment

Ports: web 55008. No env keys added, changed or removed.

## Residual

- The computers bid conservatively and never overbid, so a "weak game" recommendation only appears after
  a reckless bid by the learner — the hint now says so. Whether the bots should ever play Hand or
  announce is a strategy question, not this ticket's.
