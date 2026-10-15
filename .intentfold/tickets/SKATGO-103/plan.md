# SKATGO-103 plan

## What the code says that the ticket does not

- `/skat-tricks` **is** the 12-tricks article today (`routes/skat-tricks.tsx`, `tricks-page.tsx`, Article
  JSON-LD, in the sitemap). The ticket makes it the exercise hub, so the article needs its own address
  under `/skat-tricks`, and the Charter's three descriptions of "the section's page is its first article"
  (`product.md`, `ui.md`, `engineering.md`) go stale.
- Five places link to `/skat-tricks`: the header ("Tricks"), the footer ("Skat-Tricks"), the table's rules
  panel ("Skat-Tricks", new tab), the front page's tile and the course's option card. The tile's and the
  card's text describe the article ("Zwölf Tricks … einfach erklärt"); the result page's "Mehr Skat-Tricks"
  is the one the ticket re-points.
- The course's widgets (`exercises.tsx`: `Choice`, `Pick`, `Play`) judge on the spot, but a wrong answer
  only shakes and lets the learner try again; nothing reveals the answer. An "answer and analysis" page
  needs a reveal.
- SkatZero runs locally from `multiplayer/` (probe: ranked values for a Grand lead, ~0.2 s with the models
  loaded). Its values are expected game points; in a won hand the cards lie within a few points of each
  other and its favourite is not always the textbook one (it preferred ♦8 over ♣J leading a solid Grand).
  So a judged exercise has to be found, not assumed: candidates are searched until SkatZero's best card
  agrees with the trick and beats the second by a margin.
- `multiplayer/` already imports the app's engine (`../../app/src/lib/skat/*`), so a multiplayer test can
  load the exercise data and re-check every SkatZero answer — the "no hand-typed answer key" decision of
  `engineering.md` holds mechanically.

## Route

1. **Data** — `app/src/lib/skat/tricks/exercises/`:
   - `types.ts`: an exercise = id (`reizen-1` …), type (1–12), the step (the course's `ChoiceStep`,
     `PickStep` or `PlayStep`, plus what a picture needs: contract, played tricks for counting, open hands
     for endgames), the trick it practises.
   - `positions.ts`: the 36 positions, language-free; every exact answer **computed** there from the
     engine (`value.ts`, `cards.ts`, the solver) rather than typed.
   - `text.de.ts`, `text.en.ts`: prompts, options, explanations, type titles and blurbs.
   - `solve.ts`: a small exact solver — open-card minimax for endgames (types 7, 8, 9), and enumeration
     of unseen card splits for "can it still be lost" (7) and Null danger (10); probability by counting (11).
2. **Checks** — `app/.../exercises/exercises.test.ts` (each exact answer equals the engine's, every card
   legal and unique, 12 types × 3) and `multiplayer/test/tricks-exercises.test.ts` (each SkatZero-judged
   answer is SkatZero's choice and beats the second option by the margin). A one-off script writes the
   verification table for the handoff.
3. **Pages**
   - `/skat-tricks` → `TricksPage` becomes the hub: H1, one-line lead, 12 type cards (option cards;
     a tap opens/closes the card's three exercises as links), and under the cards a small link to the
     article. Server-rendered; the cards' titles and blurbs are crawlable text.
   - `/skat-tricks/12-tricks` → the article, unchanged (`TricksArticlePage`, its JSON-LD moves with it).
   - `/skat-tricks/$exercise` → one exercise: a back button to the hub, the type, the question in the
     course's widget, and after the answer the verdict, the right answer shown, the explanation, a link
     to the trick, and "Nächste Aufgabe".
   - Paraglide patterns, sitemap (hub + article), noindex for exercise pages (grill Q4).
4. **Widgets** — `exercises.tsx` gains a reveal mode for the exercise page: one attempt, then the right
   answer and the explanation (grill Q3). The course keeps today's behaviour.
5. **Links** — result page link → hub, new short text (Q5); the tile and course card per Q6.
6. **Charter** — only with the human's approval (Q1).

Tokens: existing only (option card, `Panel`, `Btn`/`linkLook`, chevron icon at `icon.*`).
