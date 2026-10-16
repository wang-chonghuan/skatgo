# SKATGO-107 plan

Found in the code: `components/skat/client-page.tsx` imports all nineteen pages statically, and every route
renders `<ClientPage page=… />`, so the router's own route splitting has nothing to split: one ~1 MB main
script. TanStack Router loads a route component's `preload` before rendering on the server and before
hydrating (`router-core` `hydrate` awaits `loadRouteChunk`), so a `lazyRouteComponent` page keeps the
server's HTML and never flashes. Profiling the live front page on a 4×-throttled phone showed the 4.2 s
stall was mostly not parsing: ~3 s were the Skat-Tricks Null and endgame solver, run when
`lib/skat/tricks/exercises/positions.ts` loads — reached from every page through the exercise route's
`beforeLoad`/`head` (SKATGO-103).

Route:
1. `client-page.tsx`: each page a `lazyRouteComponent(() => import('./<page>'), '<Export>')`; export
   `clientPage(name)` for routes (`component: clientPage('entry')`) and `ClientNotFound` (static, for the
   router's default not-found). Routes still import pages only through client-page (Redline 4).
2. `legal-footer.tsx`: the footer out of `legal-page.tsx`, so the layout does not carry the legal text.
3. `positions.ts`: the four solver-backed exercise kinds (Verlierbar, Endspiel, Null ouvert, Null-Risiko)
   compute their answer on first read of `ask` / `proof`, once each; nothing else changes.
4. Charter engineering.md: the page-files row.
