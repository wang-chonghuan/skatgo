# SKATGO-29 plan

## What the code says that the ticket does not

**Stack, routing, i18n**
- TanStack Start + Nitro, file routes `/`, `/course`, `/lesson/$id`, `/play`.
- Paraglide (en, de) with a URL prefix per language. `paraglide.options.ts` `urlPatterns` maps
  every path 1:1 today, but it can map a page to a different slug per language (`/course` ↔
  `/de/kurs`). So localized slugs are affordable; no shared-slug fallback is needed.
- An unprefixed URL is answered **307** by Paraglide's middleware. The brief asks `/` for **302 +
  `Vary: Accept-Language`**, which needs its own branch in `server.ts`.

**Server rendering**
- Only the front page and the course map render on the server. Lessons and the table are
  browser-only, behind `client-page.tsx` (engineering Redline 4 fixes that shape).
- A lesson page's SSR text therefore needs a server-rendered wrapper around the client-only
  player. The rules page is new and fully static; the play page's text is SSR with the table
  client-only.

**Head tags**
- `__root.tsx` writes one title and description for **every** page (`meta_title`), canonical and
  hreflang from the path, `og:image` = the logo, and `twitter:card` = `summary`.
- There is no per-page title, no JSON-LD, and no OG image per page.

**Duplicate does not exist**
- There are no daily deals, no score vs AI, no leaderboard and no share.
- Everything in the brief that depends on it is out of scope (ticket Constraints). The full list of
  copy this removes or rewrites is grill Q1–Q3.

**Accounts and progress**
- Accounts (Clerk) are optional; nothing needs sign-up, so "No sign-up" is true.
- Progress lives in `localStorage` (`progress.ts`), per browser. It holds lessons done and stars,
  plus the free-play tally.

**Scoring and rules (engine)**
- Implemented, per ISkO: suit base values 9/10/11/12, Grand 24; Null 23/35/46/59; matadors
  counted over hand plus skat.
- Lost games score −2 × value; overbid scores the lowest multiple of the base that covers the bid.
- An all-pass hand is dealt again; there is no Ramsch.
- **Not implemented:** Kontra/Re, Ramsch, Bock, and Seeger-Fabian (no +50/−40 list scoring). Free
  play keeps a running tally: games, won, score.

**Course data**
- 11 lessons, `id` '1'–'11', each with `title`, `promise` (one line), `minutes` and steps.
- `LESSON_COUNT = lessons().length`. There are no lesson slugs yet.

**Analytics**
- PostHog (SKATGO-25) with autocapture, started only on skatgo.com.
- There is no `capture` wrapper yet. A local check cannot see events reach PostHog, so the calls are
  observed in the page instead.

**The leaked credit**
- The `@letele/playing-cards` Ace of Spades face (`SvgSA`) draws the SVG `<text>` "www.me.uk" and
  "/cards/". The Play tile shows ♠A, and SVG text is page text for crawlers.
- The deck is **CC0**: attribution is not required.

**Charter drift (human-owned, reported, not edited)**
- `ui.md` still describes the pre-SKATGO-26 card room and the four-tile front page with "coming
  soon".
- `product.md` says three languages and "only the course".

## Route

1. **Routes and URLs**
   - `urlPatterns` per page:
     - `/course` ↔ `/de/kurs`
     - `/course/:slug` ↔ `/de/kurs/:slug`
     - `/rules` ↔ `/de/regeln`
     - `/play` ↔ `/de/spielen`
   - Each lesson gets a slug per language (Q4).
   - New routes: `course.$slug.tsx` and `rules.tsx`. `course.tsx` becomes the course map at
     `course.index.tsx`.
   - 301 redirects in `server.ts`, ahead of the middleware:
     - `/{l}/lesson/{id}` → that lesson's slug;
     - `/de/course…` → `/de/kurs…`;
     - `/de/play` → `/de/spielen`.
   - `/` answers 302 to `/en` or `/de` with `Vary` (Q8).
2. **Head per page**
   - A small `pageHead()` helper builds, for one route's head:
     - title and description;
     - canonical and hreflang (en, de, x-default);
     - OG and Twitter tags (`summary_large_image`, a 1200×630 image);
     - JSON-LD: WebSite + Organization + FAQPage on `/`, Course on the course page,
       BreadcrumbList on the others.
   - The root keeps only the document-wide links.
   - `sitemap.xml` lists every indexable page in both languages, including the 11 lessons, and the
     test derives the list.
3. **Front page** (Q1–Q3): hero, "New to Skat?", "Just want a game?", FAQ. Everything else goes:
   the lobby tiles, "Coming soon" and Puzzles.
4. **Course page and lesson pages**
   - Course page: the brief's H1, lead and CTA (start or continue), and a list of every lesson with
     its `promise` and done state.
   - Completion view after the last lesson (Q2).
   - Lesson page: the lesson's question-style title and H1, 100–200 words of SSR text, then the
     client-only player, then links to the next lesson and to the rule section.
5. **Rules page**: eight sections with a table of contents, each ending in a link to its lesson,
   plus the two CTAs (Q2). Written from the engine, not from memory. Uncertain points are listed at
   handoff.
6. **Play page**: a compact H1 bar, the table filling the rest of the first screen, then the SSR
   intro text below (Q9).
7. **Credit**: the card renderer drops the deck's `<text>` (Q7).
8. **Analytics**: a `track(event, props)` wrapper over the started PostHog, fired for:
   - `hero_cta_click`
   - `lesson_start`
   - `lesson_complete`
   - `course_complete_cta_click`

   Every event carries `locale` and `page` (Q10).
9. **OG images**: a generator script renders one 1200×630 PNG per page and language into
   `app/public/og/` (Q6).
10. **Copy**
    - `LESSON_COUNT` comes from the course data; nothing hard-codes 11 or "eleven".
    - German uses du.
    - The brief's final copy is used verbatim except where Q1–Q3 remove or rewrite it.

## Redline lookup

- **ui Redline 1 (token registries)**: new layouts need new tokens and type roles, which needs
  approval (Q5).
- **ui Redlines 2–4**: no utility CSS, no inline values, no felt in the hero. Respected.
- **engineering Redline 3 (dependencies)**: none added. OG images come from Playwright in the
  ticket's `tmp/`, as SKATGO-23's icons did.
- **engineering Redline 4**: the new routes reach course pages only through `client-page.tsx`.
- **engineering Redline 5**: `routeTree.gen.ts` is regenerated, not edited.
- **product Redline 2**: `product.md` is not edited.
- No production data, no spend, no deploy (Finish: review).
