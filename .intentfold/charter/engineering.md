# Engineering

Human-authored architecture and development rules. This file defines how the product is built, how
code changes are made, and how they land. Section shape is fixed by `.intentfold/readme.md`.

The dependency inventory belongs to the lockfile; generated structure belongs to its generator.
Record here only decisions, boundaries, and commands that the repository cannot explain by itself.

> Seeded 2026-09-21 by intentfold cap1 **from the repository and from how it was built** (it was
> extracted from Parrottoon the same day), and accepted by the human as written.

## Contract

**Stack**

- **TanStack Start** (Vite, TypeScript, React 19): server-rendered shell, file-based routes. Every
  piece of course state lives in the browser, and there is no database access. There is exactly one
  server endpoint, `POST /api/ask` — the assistant (SKATGO-9) — answered in `app/src/server.ts` before
  the page router: it forwards a question to Azure OpenAI, and only for a signed-in account
  (SKATGO-12).
- **Accounts are Clerk's** (`@clerk/tanstack-react-start`, SKATGO-12): the users live at Clerk, not
  here. The only thing behind a login is the assistant; the course needs no account.
- **StyleX, compiled through Astryx's build integration** (`astryxStylex()`), with Astryx's reset and
  theme CSS underneath. `ui.md` owns styling.
- **Nitro** produces the deployable server (`app/.output/server/index.mjs`).
- Course libraries: `motion` (animation), `@letele/playing-cards` (public-domain card faces),
  `canvas-confetti`, `zustand` (progress, persisted to `localStorage`), `deep-chat-react` (the
  assistant's chat window).

**Structure**

`app/` is a **standalone project** — its own `package.json`, lockfile and `node_modules`. The repo
root has none; it holds the `Dockerfile`, whose build context is the repo root.

| Path | Owns |
|---|---|
| `app/src/lib/skat/` | the rules engine (ISkO): cards, trick-taking, game value, settlement, the whole-game state machine, and the computer players (`ai.ts`, which also writes every hint) |
| `app/src/lib/skat/lessons/` | the course: `content.ts` (lessons), `drills.ts` (randomised exercises whose answers the engine computes), `types.ts` |
| `app/src/lib/skat/progress.ts` | learner progress in `localStorage` |
| `app/src/components/skat/` | every page and widget of the course, and its own small UI kit (`ui.tsx`) |
| `app/src/lib/ask/` | the assistant's server side: the page context it is given, the limits, the model call, and the `/api/ask` handler (with its session check) |
| `app/src/start.ts` | Clerk's request middleware, which hands each page its session state |
| `app/src/skat-layout.tsx` | the frame around every page, including the sign-in button and the floating assistant |
| `app/src/routes/` | thin route files: `/`, `/lesson/$id`, `/play` |
| `app/src/theme/`, `app/src/styles/app.css` | styling — see `ui.md` |

**Key decisions**

- **The rules engine is the only judge.** Exercises are generated from random cards and judged by
  `lib/skat`; there are no hand-typed answer keys, so an exercise cannot teach something the game at
  the end contradicts. Hand-written exercises are checked against the engine by
  `lessons/lessons.test.ts`.
- **Every page of the course renders in the browser only, from one lazily loaded chunk**
  (`components/skat/client-page.tsx`). Two reasons. Nothing is renderable before the browser has the
  learner's progress and the random cards. And on this exact stack (Nitro over rolldown), importing a
  course page statically into a route once produced a server bundle that failed to load at all — an
  entry chunk exporting a binding it never defined, every page of the site answering 500
  (Parrottoon, PARROT-42). The mechanical defence below now fails the build that has that defect.
- **Split from Parrottoon on 2026-09-21**, as byte copies of its course code, theme and styles; routes
  moved from `/skat/...` to the root. The two codebases are **not synchronised**: a change in either
  does not reach the other.
- **Two build details are load-bearing and commented where they live**: the CSS layer order in
  `app/src/styles/app.css`, and the lightningcss targets in `app/vite.config.ts` that keep
  `light-dark()` native.

## Tools

**Mechanical defence**

Run once before the handoff. Each part catches a different class of defect:

```bash
npm --prefix app run typecheck && npm --prefix app run build && npm --prefix app run test && \
  node app/scripts/check-client-bundle.mjs && \
  test "$(grep -rnE 'className=|style=\{\{|#[0-9a-fA-F]{6}' app/src --exclude-dir=theme | wc -l | tr -d ' ')" = 1 && \
  node -e "import('$PWD/app/.output/server/_ssr/ssr.mjs').catch((e) => { console.error('server bundle does not link:', e.message); process.exit(1) })"
```

- **`typecheck`** — Vite compiles without typechecking; a prop or token that does not exist builds and
  ships silently otherwise.
- **`build`** — StyleX compiles at build time, so a bad style fails here.
- **`test`** — the rules engine, including 300 whole games between three computer players, and every
  lesson's exercises against the engine.
- **`check-client-bundle.mjs`** — a server-only reference (`Buffer.from`, `process.env`) that reached a
  browser chunk and would kill hydration.
- **the grep** — `ui.md`'s literal check. Exactly one hit is correct: the `theme-color` meta in
  `app/src/routes/__root.tsx`, which cannot read a CSS variable.
- **the import** — links the built server's SSR chunk. It is what catches the 500-everywhere build
  described under Key decisions; it was made to go red against the defective PARROT-42 build before
  it was written here.

**Architecture and generation**

- **Generated, never hand-edited**: `app/src/routeTree.gen.ts` (TanStack Start writes it from
  `app/src/routes/`), and `app/src/theme/parrottoon.{css,js,d.ts}` (rebuilt from
  `app/src/theme/parrottoonTheme.ts` — the command is in `ui.md`).

**Dependencies**

npm, with `app/package-lock.json` as the source of truth: `npm --prefix app install`.

**Landing changes**

Through a **pull request** to `main`, squash-merged. There is no CI; the mechanical defence is run
locally before the handoff.

```bash
gh pr list --head <branch> --state all
gh pr create --base main --head <branch> --title "<title>" --body "<body>"
gh pr checks <number>
gh pr merge <number> --squash
```

The ticket branch is deleted at close, not by the merge command: `--delete-branch` fails from a
linked worktree after the merge has already landed.

## Guidance

**No gratuitous dependencies.** If the existing stack can meet the requirement, do not add, remove,
or change a library. A dependency change is admissible only when the stack genuinely cannot meet the
requirement and the ticket records the human's decision.

**Reuse before inventing.** Existing helpers, config paths, schemas, components, and sources of truth
come first. A second way to do something that already has a way is a defect.

**Respect ownership boundaries.** Put behavior in the module that owns it. Do not reach through a
public interface into another module's private implementation for convenience.

**No fake progress.** No TEMP markers, degradation branches, or mocks standing in for a failed
external dependency. A failed premise is a stop and a report.

**Surgical changes.** Touch what the ticket needs. Do not reformat unrelated files or fold adjacent
cleanup into the same change.

**Uncertainty surfaces.** Ask rather than invent a fallback, compatibility layer, data meaning, or
cross-module contract.

**Complexity hotspots**

- **`app/src/lib/skat/value.ts` and `game.ts` are the rules.** A change there changes what every
  exercise and every hint says. Change the rule, then let the tests say which exercises moved; never
  adjust an exercise to agree with a rule that is wrong.
- **`app/src/lib/skat/ai.ts` is both the opponents and the hint.** Making a computer player stronger
  also changes what the learner is told to do and why; the reason strings are part of the teaching.
- **Anything random runs in the browser only.** Drills and the deal use `Math.random`; rendering one on
  the server would hand the browser a different question from the one it then hydrates.
- **Progress lives in `localStorage` under one versioned key** (`progress.ts`). Changing its shape
  without a new key or a migration silently loses every learner's progress.

## Redlines

1. **Committing credentials, tokens, connection strings, or hidden account data** — forbidden
   outright, including source, fixtures, ticket artifacts, and commits.
2. **Discarding or reverting a change already present in a dirty worktree** — forbidden outright.
3. **Adding, removing, or changing a dependency** — not without the human's explicit approval and a
   ticket carrying that decision.
4. **A route file under `app/src/routes/` importing a course page other than through
   `~/components/skat/client-page`** — forbidden outright. Detectable from the
   imports of the route files. It is the shape that produced the 500-everywhere build.
5. **Hand-editing `app/src/routeTree.gen.ts` or `app/src/theme/parrottoon.{css,js,d.ts}`** — forbidden
   outright. They are generated.
6. **A server-only reference in a browser chunk** — forbidden outright. Detectable by
   `app/scripts/check-client-bundle.mjs`.
7. **Weakening a check to make it pass** — forbidden outright: deleting an
   assertion, loosening the grep, or skipping a test. The check failing is the check working.
