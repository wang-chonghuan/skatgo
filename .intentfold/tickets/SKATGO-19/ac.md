# SKATGO-19 acceptance checks

Baseline = `main` at the ticket's base commit, built and served with `node .output/server/index.mjs`;
candidate = the ticket branch, built the same way on port 55019. Headed Playwright, fresh context,
desktop 1280×820 and phone 375×812 (`isMobile`, `hasTouch`). Progress written the way
`progress.ts` stores it; `Math.random` seeded by an init script so both builds get the same deal and
drills; animations settled before each shot. Scripts under `tickets/SKATGO-19/tmp/`.

## AC1 — looks the same
States: course map (fresh and with 3 lessons done), a teach step, a choice step answered wrong, a pick
step, a play step, the whole-game table at the learner's first turn, the settlement panel, the
assistant window open. For each state × viewport, pixel-diff baseline vs candidate.
Pass: zero differing pixels except on the elements grill Q1 names (line heights 1.25/1.3→1.2,
1.5→1.6, 1.7→1.75; spacing 1→2, 3→4, 5→6; large-button padding 26→24). Q3 (declare 700) and Q5
(theme-color) change no page pixels.

## AC2 — requested weights are loaded
In each state above, collect every element's computed `font-family` + `font-weight`, and
`document.fonts` loaded faces. Pass: every (family, weight) pair used has a loaded face of exactly that
weight.

## AC3 — a literal breaks the build
Run the mechanical defence (pass). Insert in turn into a component style: `gap: 7`,
`transitionDuration: '90ms'`, `color: '#123456'`, `fontSize: 15`, and `transition={{ duration: 0.3 }}`
on a motion element; each run must fail naming the file and line. Revert; it passes again.
Also: the checker run against an empty file list exits non-zero.

## AC4 — ui.md names tokens, and they exist
Extract every token reference from ui.md's design-system sections; each resolves to a key in a
registry under `app/src/theme/`; and `app/src/styles/app.css` references no section or path that
doesn't exist. Pass: 0 unresolved.
