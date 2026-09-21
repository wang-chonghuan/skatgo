# SKATGO-7 handoff — 取消课程加锁，每课都能直接打开

## What changed

- `components/skat/lesson-page.tsx`: no progress gate — any existing lesson opens; an unknown id goes
  back to the map.
- `components/skat/course-home.tsx`: every lesson card is a link, no 🔒. States: done (green, stars),
  next (the lesson "continue" points at — brass outline as before), open (plain card, brass outline on
  hover). Locked styles removed.
- `lib/skat/lessons/content.ts`: `isUnlocked` removed. `lib/skat/progress.ts`: the `hydrated` flag,
  used only by the gate, removed; the stored key, shape and records are unchanged.
- `lessons.test.ts`: the unlock test (a removed rule) became a unique-ids test. `public/sitemap.xml` and
  `sitemap.test.ts`: the reason lessons are not listed corrected (they render in the browser only).

## AC results

Built server on port 55007, headed Playwright, `tmp/ac.mjs` (uncommitted). Basic function only.

1. **Fresh browser, no locks — pass** (zh/en/de × desktop/phone): 11 cards, all links, no 🔒; on
   desktop each of the 11 opened its lesson.
2. **Direct lesson address — pass**: a fresh browser on `/xx/lesson/7` sees lesson 7, URL unchanged.
3. **Existing progress — pass**: with lessons 1–3 recorded, cards 1–3 show their stars (3/2/1),
   "continue" goes to lesson 4, card 4 is the brass "next"; no horizontal scroll; no console errors.
- Mechanical defence (typecheck, build, 53 tests, client-bundle check, grep = 1, SSR link) passes.

## Deviations

None from `plan.md`.

## Environment

Ports: web 55007. No env keys added, changed or removed.

## Residual

- `charter/product.md` describes "eleven lessons take a learner from … to a full game"; nothing there
  requires order, so no drift. `engineering.md` § Complexity hotspots still names progress in
  localStorage as the gate-sensitive store — its wording about lessons looking locked is not in the
  charter; no charter change needed.
