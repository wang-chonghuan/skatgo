# SKATGO-43 plan

## What the code says that the ticket does not

- The frame is chosen in `app/src/skat-layout.tsx` by `sectionOf(pathname)` (`components/skat/frame.tsx`):
  `home` gets `LandingHeader` over a white page, `play` the full-screen table, and every other section
  (`daily`, `course`, `rules`) the app frame: `Rail` (desktop), `TabBar` (phone), `AppShell` padding.
- `section: 'course'` covers both `/course` and every lesson (`/course/$slug`), so the frame cannot be
  decided by section alone once lessons keep the app frame.
- The orange band is `Band` in `frame.tsx`. It is rendered by each page itself: `course-home.tsx`,
  `rules-page.tsx`, `daily-page.tsx` and `lesson-page.tsx`. It is the page's only `<h1>` and also
  carries back/home links and a second copy of language, settings and account.
- The front page's white page (`color.surface`) differs from the sub-pages' grey page (`color.page`),
  on which their white option cards (`color.surface` + `elev.option`) stand off.
- TanStack `<Link>` already marks the current page `aria-current="page"`; the header shows no visual
  current state today.
- Every needed value already exists in the registries (`typography.landingHeading`, `color.navy`,
  `space.*`): no registry change (ui.md redline 1).

## Route

1. `frame.tsx`: export `frameOf(pathname)` — `'landing' | 'app' | 'table'`. Landing: `/`, `/course`
   (exactly, not its lessons), `/rules`, `/daily` (grill Q1/Q2). Table: `/play`,
   `/daily/play`. App: everything else (the lessons). `sectionOf` stays for the rail's active item.
2. `skat-layout.tsx`: choose the frame by `frameOf`; the front page keeps its white page, the three
   sub-pages keep the grey `color.page` (grill Q5); the header is the same `LandingHeader` (Q6).
3. `course-home.tsx`, `rules-page.tsx`, `daily-page.tsx`: drop `<Band>`; the band's title becomes the
   content column's `<h1>`, first in the column, `typography.landingHeading` in `color.navy` (grill Q4).
4. Lesson pages (grill Q3), `/play` and `/daily/play` untouched; `Band`, `Rail`, `TabBar`, `AppShell` stay for the lessons.
5. Build, then the AC script against the built server.
