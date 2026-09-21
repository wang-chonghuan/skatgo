# SKATGO-1 grill (self-adjudicated — ticket row `Grill: self`)

Sources allowed: the charter, and what was observed in code or the running system. Two questions
went to the human mid-run because only they could answer them (dependency approval, SEO depth);
their answers are recorded as a ticket comment and folded in here.

## Premises

1. **Does Paraglide work on this exact stack (TanStack Start 1.168 + Nitro 3 beta + Vite 8)?**
   Observed: the official example `TanStack/router/examples/react/start-i18n-paraglide` uses the same
   Start/Vite majors; `@inlang/paraglide-js@2.25.4` installs and `paraglide-js compile` produced
   `src/paraglide/{runtime,server,messages}.js` here. Not yet observed: Nitro picking up
   `src/server.ts` as the server entry — first thing slice 1 proves on the built server; if it does
   not, that is a stop, not a workaround.
2. **Build-time network.** The inlang project loads its two plugins from jsdelivr at compile time
   (official settings). `az acr build` has network; `project.inlang/cache` is git-ignored by inlang
   itself. Accepted.
3. **Generated output vs. the mechanical defence.** `src/paraglide/` sits under `app/src`, where the
   literal grep runs. Observed after a compile: the grep still returns exactly the one allowed line;
   no `process.env` / `Buffer.from` in the runtime. The dir ignores itself (`*`), so `typecheck` must
   compile first — the script is changed to do that rather than committing generated files.

## Against the charter

4. **Redline engineering 3 (dependency)** — approved by the human for Paraglide, recorded on the
   ticket. No other dependency is added.
5. **Redline engineering 4 (route files import course pages only through `client-page`)** — kept:
   route files still import only `~/components/skat/client-page`. The course map's server rendering
   (approved) is done inside that module. The defect the redline exists for (a server bundle that does
   not link) is still caught by the mechanical defence's import of the built SSR chunk.
6. **Engineering Key decision "every page renders in the browser only"** — the human approved
   changing it for the course map only. The charter text is human-owned and is **not** edited; the
   drift is reported in the handoff.
7. **operations.md post-deploy check** derives routes from `routeTree.gen.ts` and expects `200` on
   each unprefixed path. After this ticket, `/`, `/play`, `/lesson/lesson` answer with a redirect to
   the detected locale — the check as written will fail on the new behaviour. Charter drift: reported
   in the handoff, not fixed here (Finish is `review`; no deploy happens in this ticket).
8. **Progress storage** (hotspot): unchanged key and shape; language is not part of it.
9. **`ai.ts` reason strings are teaching text** (hotspot): the Chinese wording is kept byte-identical
   as the `zh` messages; only where the string is assembled moves out of the engine.
10. **UI tokens** (ui redline 1): the switcher uses existing roles only (felt/white on the header,
    brass + ink for the active language). No new token.

## Do the criteria pin down "done"?

11. **What language does a browser that asks for none of the three get?** Ticket: default by browser.
    Decision: base locale **en** — the widest second language of a visitor who reads neither Chinese
    nor German. `zh-TW` / `zh-HK` get the (Simplified) `zh` course: Paraglide matches on the base tag.
12. **Where is the choice remembered?** Paraglide's cookie `PARAGLIDE_LOCALE` (≈400 days), set only
    by an explicit switch. A shared `/zh/…` link opened by a German reader shows Chinese (the URL
    wins, strategy order `url` first) and does not overwrite their saved choice.
13. **Switching mid-lesson or mid-game** — Paraglide's `setLocale` navigates to the localized URL
    (document navigation). A lesson restarts from its first step in the new language and a running
    game is re-dealt; completed lessons and scores are in localStorage and survive. AC2 asks for an
    immediate switch; it does not ask for mid-step continuity. Accepted, stated in the handoff.
14. **"No other language mixed in"** (AC1) — the Skat words the course keeps German in every language
    (Grand, Null, Hand, Schneider, Schwarz, Ouvert, Matador) and the name Skat are allowed; opponent
    names become Lina / Max in en and de (莉娜 / 马克斯 in zh).
15. **Unprefixed legacy URLs** (`/play`, `/lesson/3` from before the split) redirect to the detected
    locale — nothing breaks for existing links.
16. **Lesson pages in the sitemap?** No: a lesson after the first redirects a new visitor to the map,
    so only `/{locale}` and `/{locale}/play` are listed, each with its hreflang alternates.

## Constraints earning their place

17. **Terms researched with sources** — kept; `terms.md` records each choice and its source.
    **Card letters in German**: German Skat notation writes Bube / Dame as B / D; the pictured faces
    carry J / Q. Decision pending the research: follow the German standard in text and say once, in
    the lesson that introduces ranks, what the letters on these cards mean — the learner meets
    German-indexed cards at a real table, which is the product's promise.
18. **Separate URLs per language** — kept (SEO, shareable).
