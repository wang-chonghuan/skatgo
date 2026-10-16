# SKATGO-107 grill — self-adjudicated (Grill: self; the human: 「自动grill」)

1. **Split pages by React.lazy in a Suspense boundary, or by the router's lazyRouteComponent?**
   Recommendation: lazyRouteComponent — the router awaits it before SSR render and before hydration, so the
   HTML crawlers read is complete and nothing flashes; a Suspense boundary could stream a fallback first.
   **Answer: lazyRouteComponent.**
2. **Redline 4 (routes reach pages only through client-page).** Keep it: client-page stays the only door,
   now returning lazy components. **Answer: kept; no charter redline change.**
3. **The solver found in profiling (SKATGO-103's exercises) — in scope?** It is ~3 s of the 4.2 s stall on
   every page, the ticket's own symptom. Recommendation: make only its answers lazy (computed on first
   show, once), leaving the exercises and their checks as they are. **Answer: in scope, lazy answers.**
4. **Route `head`/`beforeLoad` still import lesson and exercise text (≈120 KB) into the main script.**
   Moving them needs server-only head data — a larger change. **Answer: left; noted as residual.**
5. **Premise probe:** live measurements and the per-commit build sizes are in the ticket's diagnosis
   (main script 1,021,513 B at 349992a; phone stall 4.2 s).
