# SKATGO-107 handoff

## What changed
- `app/src/components/skat/client-page.tsx`: every page is a `lazyRouteComponent` (its own chunk);
  `clientPage(name)` is a route's component, `ClientNotFound` the router's default not-found. The router
  loads the page's chunk before rendering on the server and before hydrating, so the HTML is unchanged.
- All 18 route files: `component: clientPage('…')` instead of `() => <ClientPage page="…" />`;
  `app/src/router.tsx`: `defaultNotFoundComponent: ClientNotFound`. Routes still import pages only
  through client-page (Redline 4).
- `app/src/components/skat/legal-footer.tsx` (new): the footer, moved out of `legal-page.tsx` so the
  layout does not carry the privacy and terms text.
- `app/src/lib/skat/tricks/exercises/positions.ts`: the solver-backed exercises (Verlierbar, Endspiel,
  Null ouvert, Null-Risiko) work out `ask` / `proof` on first read, once each, instead of at module load.
  Their tests still solve every one.
- Charter `engineering.md`: the page-files row.

## AC results
1. **Main script smaller, other pages' code out** — PASS. `index-*.js` 1,021,513 B → 684,496 B (−33%);
   71 client chunks instead of one. Source-map breakdown: no page components left in it (motion,
   entry page, lessons/rules/tricks/legal pages now in their own chunks); what remains is React, router,
   Clerk, query and the route titles' text.
2. **Stall much shorter** — PASS. Same measurement as the diagnosis, served build: phone (CPU 4×)
   longest task 80 ms (live before: 4,184 ms); desktop no long task (live before: 831 ms). CPU profile:
   the solver no longer runs on load (it was ~3 s of the phone's stall).
3. **All pages work; readable without JS** — PASS. 21 addresses × desktop and phone: status (404 for the
   unknown address), h1, main text, no page errors. Client navigation from the front page without reload;
   the Null-Risiko exercise answers after a choice. `check:seo -- --built` (JavaScript disabled) passes,
   48 pages.

Mechanical defence: PASS (typecheck, build, 130 tests, 71 client chunks clean, tokens, literal grep,
server bundle links, SEO, test:seo 25/25). Multiplayer untouched.

## Deviations
- Beyond the proposed solution: the footer split and the lazy solver answers, both found by measuring
  (grill.md 3). The solver was the main cause of the stall.

## Environment
- Ports: web 55107 (multiplayer and database not started). No env keys changed.

## Residual
- Route `head` / `beforeLoad` still bring lesson, quick-start and exercise text (~120 KB) into the main
  script; moving page titles to server-only data would remove it.
- A Skat-Tricks Null exercise page still solves its own answer when opened (one exercise's, not all).
