# SKATGO-1 handoff — 课程中英德三语、按浏览器定语言、右上角切换、独立网址

## What changed

**i18n plumbing (Paraglide JS — dependency approved by the human, ticket comment 2026-09-21)**
- `app/paraglide.options.ts` (shared by `vite.config.ts` and `vitest.config.ts`), `app/project.inlang/settings.json`,
  `app/messages/{en,de,zh}.json` (224 keys each). Generated runtime in `app/src/paraglide/` (self-ignored);
  `typecheck` compiles it first; `tsconfig` `allowJs: true` so the JSDoc-typed output typechecks.
- `app/src/server.ts`: `paraglideMiddleware` — URL prefix → cookie `PARAGLIDE_LOCALE` → `Accept-Language`
  → `en`; unprefixed URLs (`/`, `/play`, `/lesson/3`) redirect (307) to the chosen language.
- `app/src/router.tsx`: `rewrite` de/localizes URLs, so the route tree and every `<Link>` stay language-free.

**Engine language-free** — `cards.ts`, `game.ts`, `value.ts`, `ai.ts` return facts (settlement `parts`/`reason`
and hint `reason` are codes + cited cards); `app/src/lib/skat/i18n.ts` phrases them. Chinese wording moved
byte-identical into `zh.json`. `drills.ts` phrases through messages.

**Content per language** — `lessons/content.zh.ts` (the old `content.ts`, with 弃牌→扣牌, 做短门→做断门),
`content.en.ts`, `content.de.ts`; `content.ts` selects by locale; `build.ts` holds `gen`/`times`.

**UI** — every component reads `m.*`; `skat-layout.tsx` has the language switch (real `<a hreflang>` links,
click → `setLocale`); seat line may wrap on phones.

**SEO** — `__root.tsx` head per locale (title, description, og incl. `og:locale`/`og:url`, canonical,
hreflang en/de/zh-Hans + x-default, `<html lang>`); `public/sitemap.xml`, `public/robots.txt`; the course
map is server-rendered (`client-page.tsx` renders `CourseHome` directly; progress applied after mount;
`progress.ts` tolerates having no storage on the server).

**Tests** — `lessons.test.ts`: all three courses checked against the engine, and en/de proven structurally
identical to zh (cards, answers, best plays; random drills dealt from the same seed); catalogues have the
same keys and parameters; en/de contain no Chinese. `sitemap.test.ts`: sitemap derived from the route tree
and locales.

**Terminology** — `terms.md` (decisions) and `terms-research.md` (sources per concept).

## AC results

Built server `node .output/server/index.mjs` on port 55001, headed Playwright Chromium, script
`tmp/ac.mjs` (uncommitted), fresh contexts. Recorded per the user's rule (relayed 2026-09-21): acceptance
covers basic functions only; **gameplay is left to the user's own testing and is not claimed here.**

- **AC1 — pass (basic functions).** Browser `zh-CN` / `en-US` / `de-DE` opening `/` land on `/zh`, `/en`,
  `/de`, `<html lang>` `zh-Hans` / `en` / `de`. Text over the course map, lessons 1–10 (every step,
  wrong-answer feedback included) and the table: no CJK on en/de, no Latin word on zh except
  Grand/Null/Hand/Schneider/Schwarz/Ouvert/Matador/Skat, no fragment of another language's messages.
- **AC2 — pass** at 1280×820 and 375×812 on `/en`, `/en/lesson/1`, `/en/play`: switch inside the header,
  right edge ≤ 32px from the viewport edge, no horizontal scroll; clicking DE goes to `/de/…` in German;
  reload keeps German; a new page on `/` lands on `/de`.
- **AC3 — lessons pass; gameplay left to the user.** Lessons 1–10 completed with every exercise judged
  right in each language (desktop), lesson 1 on the phone (German); the table opens and deals in each
  language; no console errors in any run. That exercise judgement and game results do not depend on the
  language is proven mechanically by the parity test (same cards, answers and best plays in all three
  courses; engine free of language). **"和电脑打完一整局" — 对局玩法留给用户亲测，不记为通过。**
  (For the record: the first round, 48/48, did play games to the settlement without errors, and later
  rounds saw the declarer's seat and a won game in each language; these runs are why the rule now exists,
  and they are not offered as acceptance.)
- Mechanical defence (`charter/engineering.md` § Tools), run once after the last change: typecheck,
  build, 47 tests, client-bundle check, literal grep = 1, SSR chunk links — all pass.

## Deviations

- Added mid-run by the human: standard i18n library + SEO; approved Paraglide and server-rendering the
  course map (ticket comment). `plan.md` was written after that answer, so the plan itself holds.
- AC1's leak check ignores the language switch (it names 中文 in its own script, by design) and the card
  faces (the deck's SVG carries its attribution `www.me.uk/cards/`).
- `ac.md` planned whole games for AC3; by the user's later rule gameplay moved to the user's own testing.

## Environment

Ports: web 55001 (ticket), 3220 main unchanged. No env keys added, changed or removed.

## Residual

- **Charter drift for the human:** `operations.md` post-deploy check expects 200 on unprefixed paths; they
  now redirect (307) to a language — the check needs `curl -L` or prefixed routes. `engineering.md` still
  says every course page renders in the browser only; the course map now renders on the server.
- Switching language reloads the page (Paraglide default): a lesson restarts, a running game is re-dealt.
- On a phone, "Mittelhand" is clipped while a bid bubble sits beside it (German only).
- The step slide-in briefly widens the layout by ~16px on phones (pre-existing animation, all languages).
