# SKATGO-28 handoff — remove Chinese

Scope as narrowed by the human on 2026-09-30: remove Chinese only; everything else stays.

## What changed

- **Languages** — `app/project.inlang/settings.json` lists `en` and `de`. `messages/zh.json` and the
  Chinese course `lib/skat/lessons/content.zh.ts` are deleted; `content.ts`, `site.ts` (`LANG_TAG`),
  the language menu (`frame.tsx` `NAME`), the assistant's answer language (`ask/context.ts`) and
  `paraglide.options.ts` (URL patterns) no longer know Chinese.
- **Language rule** (`lib/locale.ts`) — unchanged except that a saved choice must be a current locale:
  a `PARAGLIDE_LOCALE=zh` cookie from before counts as none and the browser rule decides.
- **Old addresses** (`server.ts`) — `/zh` and `/zh/...` answer 301 to the same path (and query) under
  `/en`, before the language middleware.
- **Sitemap** — the `/zh` entries and `zh-Hans` alternates are gone.
- **Front page** — the facts strip's languages item reads "English · German" / "Deutsch · Englisch".
  Nothing else on the page changed (no hero or style change).
- **Tests** — `lessons.test.ts` uses the English course as the reference (every course still checked
  for no Chinese); `locale.test.ts` tests that a stored `zh` falls back to the browser rule;
  `ask.test.ts` uses English.
- Comments that named the Chinese course or `/zh` were updated in the touched files.

## AC results

Built server on port 55028, headed Playwright (`tmp/ac.mjs`), 1280×820 and 375×812.

- **AC1 no Chinese** — PASS. `/`, `/course`, `/play`, `/lesson/1` (steps 1–3) in en and de at both
  viewports: no `\p{Script=Han}` in rendered text; the menu offers exactly English, Deutsch;
  hreflang is en, de, x-default. `sitemap.xml` has no zh. `/zh` → 301 `/en`, `/zh/course` → 301
  `/en/course`, `/zh/play?x=1` → 301 `/en/play?x=1`; `/zh/play` ends on the English table.
- **AC2 language rule** — PASS. `/` with `de-DE,de` → `/de`; `zh-CN,zh`, `en-US`, `fr-FR`, none →
  `/en`. After choosing Deutsch, `/` → `/de`. A `zh` cookie with a German browser → `/de`.
- **AC3 front page otherwise unchanged** — PASS. The languages item reads "English · German" /
  "Deutsch · Englisch"; the only message diff from `main` is that key; `entry-page.tsx` is unchanged.
- **Mechanical defence** — PASS (typecheck, build, 65 tests, bundle, tokens, literal grep, SSR link).
- The post-deploy check derives locales from the inlang settings: 2 (`en`, `de`).

## Deviations

- Plan steps 6 (hero lead, "fully supported" wording) and grill Q2/Q3 were dropped by the human's
  narrowing; Q1 and Q4 were taken as recommended.

## Environment

- Port: web 55028 (the built server). No env key added, changed or removed.

## Residual

- `charter/product.md` (lines 16, 36–38) still says three languages, and `charter/operations.md`
  names `/zh` in the post-deploy prose — human-owned, to be updated by the human.
- The hero slogan work (grill Q2 research and proposals) is left for a future ticket.
- `theme/parrottoonTheme.ts` still carries a comment about Chinese headings in its font stack.
