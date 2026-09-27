# SKATGO-18 handoff — 整理现有设计系统写入 ui.md

## What changed

No product code. One file, at the human's request (a Charter edit the human asked for):

- **`.intentfold/charter/ui.md` `## Contract`** now carries the current design system, extracted from
  `app/src`: the four surfaces (page, felt, deep felt, paper on felt) and what text goes on each; a
  role for every one of the 23 palette tokens (values stay in `skat.stylex.ts`); the two families and
  the type scale (size / phone size / weight / line height per role); radius, border-width, spacing
  and elevation forms; the kit (`Btn`, `linkLook`, `Panel`, `Pill`, `ProgressBar`, `Stars`, `Rich`)
  with every variant and when to use it; the course widgets (`PlayingCard`, `Fan`, `CardRowView`,
  `Shake` / `Feedback`, `GameTable`) and recurring patterns (tile choice, lesson card, round icon
  button, launcher); layout additions; motion. The existing Contract text is kept.
- **`## Guidance`** gains "Build from the system above" (a value outside the tables is a question for
  the human), "One primary per view", and the focus-ring rule. Tools and Redlines are unchanged.
- One correction to existing text: the deep-chat palette is handed over in
  `components/skat/ask-thread.tsx`, not `ask.tsx` as the file said.

## AC results

Checked by `tickets/SKATGO-18/tmp/check-ui-md.py` (uncommitted), which reads ui.md and the code:

1. **Four sections, full coverage — pass.** Headings are `## Contract`, `## Tools`, `## Guidance`,
   `## Redlines` in order; the Contract has sections for surfaces, colour roles, typography, shape,
   spacing, elevation, kit components, course widgets, layout/responsive and motion; content and tone
   stays in Guidance.
2. **Everything named exists — pass, 0 missing.** The palette table equals the registry (23/23, none
   extra); each token's "not yet used" note matches the code (`feltLine`, `scrim` unused, all others
   used); all kit exports and every tone/size variant; the six widgets; card sizes 34/52/72(58)/96(72)
   and 5:7; the font families, breakpoints 860/720/600/480, transition durations and motion numbers;
   every font weight, radius and font size used in the course is one ui.md names. The first run
   found two gaps in the draft — the send button's lucide icon and the phone sheet's radius 0 — and
   ui.md was corrected before this handoff.
3. **No `app/` change — pass.** `git diff --name-only 60a1c0f -- . ':!.intentfold'` is empty.

Mechanical defence (engineering.md Tools) run once: typecheck, build, 67/67 tests, client-bundle
check, literal grep = 1, SSR link — all pass.

## Deviations

None from the ticket. Chore: no plan.md / ac.md / grill. As the Proposed solution suggested, values
stay in the registry and ui.md names roles; sizes, radii and spacing are written as the de facto
scales found in code, with the odd outliers (1/3/5px nudges, 40/80 screen padding) named rather than
normalised.

## Environment

No service started — the deliverable is a document. Port 55018 reserved, unused. No env keys added,
changed or removed.

## Residual

- Headings use weight 800, but Google Fonts loads DM Sans 400–700 and Fraunces 400–700, so 800
  renders as a synthesized or 700 weight. Either load 800 or use 700 — a UI ticket.
- `app/src/styles/app.css` points to "ui.md § Switching the theme", a section that does not exist.
- `engineering.md` still says `/api/ask` answers only a signed-in account; SKATGO-13 removed that
  gate (reported earlier, human-owned).
- The spacing, radius and type scales are conventions, not tokens; making them mechanical
  (a `defineVars` scale, or a grep) would need the human's approval under ui.md Redline 1.
