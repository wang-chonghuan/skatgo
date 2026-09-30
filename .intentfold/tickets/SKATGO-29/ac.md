# SKATGO-29 acceptance checks

**Setup.** Checked against the built server on port 55029. Playwright runs headed at 1280×820 and at
375×812 (isMobile, hasTouch). The page list is:

- `/en`, `/en/course`, all 11 lessons, `/en/rules`, `/en/play`;
- the same pages under `/de`, on their German slugs.

## AC1 — server-rendered copy, nothing that does not exist

For each page, open it in a context with **JavaScript disabled**. Pass when:

- the H1 matches the approved copy, and the body text matches it too;
- the front page also shows the FAQ;
- each lesson page also shows its 100–200 word intro, counted in the SSR HTML.

Then, with JavaScript on, collect the rendered text of every page. Pass when none of these appear:

- `Coming soon`, `soon`, `bald`, `demnächst`, `Puzzles`, `me.uk`;
- `/cards/` as text.

## AC2 — head tags, sitemap and `/`

Parse the SSR HTML of every page. Pass when:

- **Title and description:** each page has its own title and description, and no two pages share
  either.
- **Canonical and hreflang:** the canonical is the page's own URL, and the hreflang links are
  `en`, `de` and `x-default` pointing at the right counterparts.
- **Social tags:**
  - `og:title`, `og:description`, `og:url` and `og:image` are all present;
  - `twitter:card` is `summary_large_image`;
  - the `og:image` URL answers 200 with a 1200×630 PNG.
- **JSON-LD:**
  - `/`: WebSite, Organization and FAQPage, with the FAQ matching the visible FAQ;
  - the course page: Course;
  - every other page: BreadcrumbList;
  - every block parses as JSON.
- **Sitemap:** `sitemap.xml` lists every page above with its alternates, and `robots.txt` names it.
- **`/` redirect:** `curl -I /` answers 302:
  - with `Accept-Language: de-DE` it goes to `/de`;
  - with `en-US`, `fr`, or no header it goes to `/en`;
  - the response carries a `Vary` that includes `Accept-Language`.
- **Old URLs:** each answers 301 to its new URL:
  - `/en/lesson/7` and `/de/lesson/7`;
  - `/de/course`;
  - `/de/play`.

## AC3 — rules and lessons link both ways, values match the engine

On `/en/rules` and `/de/regeln`:
- The table of contents links to all eight section anchors.
- Each section ends in a link to a lesson page that exists.
- Every lesson page links back to an existing section anchor, and to the next lesson.
- The values the page states match the engine's constants:
  - 9, 10, 11, 12 and 24;
  - Null 23, 35, 46 and 59;
  - the bidding ladder the page lists equals the engine's `nextBid` sequence.

  The check reads both the page text and the engine modules.

## AC4 — phone, focus, motion, events

- **Phone width:** at 375px, no page has `scrollWidth > clientWidth`.
- **Keyboard focus:** tab through each page's first five focusable elements; each shows a visible
  outline.
- **Reduced motion:** with `reducedMotion: 'reduce'`, the front page's elements report no running
  CSS animations or transitions longer than 0.
- **Events:** PostHog is started only on skatgo.com. Locally, a test hook records `track()` calls.
  Pass when:
  - clicking each hero button records `hero_cta_click` with state `A` and `primary` or `secondary`;
  - opening a lesson records `lesson_start`;
  - finishing a lesson (progress written the way `progress.ts` stores it, then the last step)
    records `lesson_complete` with the lesson number;
  - the completion CTA records `course_complete_cta_click`;
  - every event carries `locale` and `page`.

## Also run

- The mechanical defence.
- LCP of `/en` and `/de`, measured with the browser's `largest-contentful-paint` entry on the built
  server. Reported, not a gate, since local is not production.
