# SKATGO-1 plan

## What the code already promises (and the ticket does not say)

- **All shipped text is Chinese and scattered across five layers**: lesson content
  (`lessons/content.ts`, 575 lines), drill phrasing (`lessons/drills.ts`), the rules engine's own
  strings (`cards.ts` suit names and `contractName`, `game.ts` seat names, `value.ts` settlement
  labels and reasons, `ai.ts` every hint reason), and the components (`course-home`, `lesson-player`,
  `exercises`, `game-table`, `ui`, `playing-card`, `client-page`, `skat-layout`, `__root` head).
- **Every course page renders in the browser only** (`client-page.tsx`); `__root` hard-codes
  `<html lang="en">` while the layout says `lang="zh-Hans"`; head title/description are Chinese.
- **Progress** is one localStorage key (`parrottoon.skat.progress.v1`) keyed by lesson id — language
  independent, so it must stay untouched: the three languages share one progress.
- **Hand-written exercises are claims checked against the engine** (`lessons.test.ts`). Three
  translations of the same exercise must not be able to drift apart in cards or answers.
- The card faces (`@letele/playing-cards`) carry English indices J / Q / K / A.

Still undecided when drafting → settled in `grill.md`.

## Approach

Paraglide JS (approved by the human, ticket comment 2026-09-21) following TanStack's official
`start-i18n-paraglide` example:

1. **Locale plumbing.** `project.inlang/settings.json` (locales `en`, `de`, `zh`; base `en`),
   `messages/{en,de,zh}.json`, `paraglideVitePlugin` in `app/vite.config.ts` with strategy
   `url → cookie → preferredLanguage → baseLocale` and URL patterns that prefix **every** locale
   (`/en`, `/de`, `/zh`). `app/src/server.ts` wraps the Start handler in `paraglideMiddleware`
   (server-side detection + redirect of `/` and unprefixed legacy paths). `router.tsx` gets the
   `rewrite` input/output pair, so the route tree stays `/`, `/lesson/$id`, `/play`.
   `typecheck` compiles Paraglide first (its output dir is generated and self-ignored).
2. **Engine stays language-free.** `cards.ts`, `game.ts`, `value.ts`, `ai.ts` stop returning Chinese
   and return structured facts (`Advice.reason` becomes a code + params; settlement `parts` and
   `reason` become codes; `SUIT_NAME` / `ROLE_NAME` / `contractName` / `cardLabel` leave the engine).
   One formatting module (`app/src/lib/skat/i18n.ts`) turns them into text with `m.*` messages.
3. **Drills** take no language: they keep generating cards and answers, and their text goes through
   the same formatting module / messages.
4. **Lesson content per locale**: `lessons/content.zh.ts` (today's text, moved), `content.en.ts`,
   `content.de.ts`; `content.ts` exposes `lessonsFor(locale)`, `lessonById(locale, id)`,
   `isUnlocked`. A parity test asserts the three are structurally identical (ids, step kinds, cards,
   answers, best cards, contracts, option counts, drill kinds) — the "cannot drift" rule made
   mechanical.
5. **Components** read every string from `m.*` / the formatting module; `ClientPage`'s loading line
   is localized.
6. **Language switch** in the header's right side: three links (中文 · EN · DE), real `<a hreflang>`
   to the localized URL, click → `setLocale()` (cookie + navigation). Styled with the existing course
   tokens only.
7. **SEO.** Root head per locale: title, description, `og:*` + `og:locale`, canonical,
   `alternate hreflang` for en / de / zh-Hans + `x-default` → `/`; `<html lang>` per locale.
   `/sitemap.xml` (server route, derived from the locales, excluded from localization) and
   `public/robots.txt` pointing to it. **Course map server-rendered**: the home page renders on the
   server from lesson data; learner progress is applied after mount so server HTML and first client
   render agree. Lessons and the game table stay browser-only.
8. **Terminology**: researched per language with sources, recorded in
   `.intentfold/tickets/SKATGO-1/terms.md`; the en/de content and messages follow it.

## Slices, in order

1. Paraglide plumbing + routing + switcher + head/SEO + sitemap/robots (with placeholder messages).
2. Engine de-Chinese-ification + formatting module + messages for engine/drills/UI chrome.
3. zh content moved, parity test; en content; de content.
4. Course map SSR.
5. Mechanical defence, AC run at both viewports.
