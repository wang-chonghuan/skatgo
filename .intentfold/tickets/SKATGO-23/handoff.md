# SKATGO-23 handoff — 入口页改为教程、打牌、复式、题库四张卡片

## What changed

- **Entry page** (`components/skat/entry-page.tsx`, route `/`): a title and lead, then four cards in a
  2×2 grid (one column on a phone). It is server-rendered; progress is applied after mount.
  - **Course** links to `/course`. Its art is three Jacks fanned on felt. The button reads 开始学 /
    继续学 and sits beside the progress line.
  - **Play** links to `/play`. Its art is a trick with a face-up ♥A between two backs; the button is
    开一桌.
  - **Duplicate** and **Puzzles** are plain `div`s with `aria-disabled="true"`. They have no link, no
    focus and nothing to click, a 即将推出 pill, and dimmed art (the same deal twice / a face-down card
    with a "?").
- **Course map** moved to `/course` (`routes/course.tsx`). It is unchanged and still server-rendered.
- **Links**: the lesson ✕, the finish screen's back button and the unknown-lesson redirect go to
  `/course`. Free play's back link goes to `/`, relabelled "← 首页 / ← Home / ← Start" (the old
  `back_to_map` message is removed). The header brand goes to `/`, as before.
- **Copy**: 16 new messages in each of zh/en/de (`app/messages/*.json`, appended as their own group).
- **Assistant**: a new page kind, `entry`. The browser (`ask.tsx`, `ask-thread.tsx`), the handler and
  `lib/ask/context.ts` are updated for it.
  - The entry context names the four sections the way the page does, in the page's language. It
    marks Duplicate and Puzzles as not open and forbids inventing their rules, scoring or dates.
  - `/course` keeps the course-map context. The window's subtitle is 首页 / Home / Start.
- **Tokens** (approved in grill Q4):
  - `size.entryArt` 120px;
  - `size.entryFanOverlap` −12px (tuned from the proposed −18px so the middle Jack shows);
  - `move.tiltLeft` / `move.tiltRight` ∓8°.
- **Sitemap**: `/course` in three languages with its alternates. The sitemap test passes.

## AC results

`tmp/ac.mjs`, headed Chromium against the built server on :55023, run on the final build (commit
`6ea4215`): **66/66 pass** (`tmp/ac-run.log`, `tmp/ac-results.json`, screenshots
`tmp/entry-{desktop,phone}-{zh,en,de}.png`).

1. **Four cards — pass.** In zh/en/de at 1280×820 and 375×812, the sections appear in the order
   course, play, duplicate, puzzles. Every title, description, button and pill matches the language's
   catalogue (the script reads the catalogues; nothing is typed in). `scrollWidth` equals the viewport
   width, and every card is inside it.
2. **Course and Play open the existing features — pass.** In every language and viewport, Course leads
   to `/{lang}/course` with 11 lessons, and its start button to lesson 1. Play leads to `/{lang}/play`,
   where a 10-card hand is dealt. No game was played.
3. **Duplicate and Puzzles do nothing and say so — pass.** Each is a `DIV` with
   `aria-disabled="true"`, no `a`, `button` or tabindex inside, and the language's "coming soon"
   text. A click causes no navigation, and the URL and history length are unchanged.
4. **Back links — pass.** In zh/en/de:
   - ✕ goes to `/course`; the finish screen's back button goes to `/course` (reached by answering
     lesson 1's exercises); an unknown lesson id goes to `/course`.
   - Free play's "← 首页 / Home / Start" goes to the entry page, and so does the header brand.
   - No page errors in any run.

**Assistant, checked by hand** (not an AC): asked on the entry page "复式什么时候上线？" and "Was ist
Duplikat und wann kommt es?". Both answers said it is not open and has no date yet, pointed to
教程/打牌 (Kurs/Spielen) in the page's language, and invented nothing. An unknown page kind is still
refused with 400.

Mechanical defence: typecheck, build, 67/67 tests (sitemap included), client-bundle, token check (54
files), literal grep = 0, SSR link — all pass. The multiplayer defence was not run: nothing under
`multiplayer/` changed.

## Deviations

- **Fan overlap**: `size.entryFanOverlap` is −12px rather than the −18px suggested in the grill; at
  −18px the middle Jack was almost hidden. It was set by eye, which the grill allowed.
- **Assistant context**: the entry context quotes the sections' names in the page's language. The
  first version named them only in English, and the model then answered in Chinese with "Course" and
  "Play" in English.

## Environment

- **Port**: web 55023. It stays running for review.
- **Env keys**: none added, changed or removed.

## Residual

- **Charter drift**, which the human owns:
  - `engineering.md`'s Structure table lists the route files as `/`, `/lesson/$id`, `/play`, and
    `operations.md`'s Runtime says the shell renders `/`, `/lesson/$id` and `/play`. Both should now
    include `/course`.
  - `ui.md` does not yet describe the entry card as a pattern.
- **Site name and meta**: the site name ("斯卡特速成课 / Skat Crash Course") and the meta title and
  description still describe only the course, although the front page now offers four sections.
- **Assistant age range**: the model's standing instructions still say "for learners from age
  twelve"; the product is now for ages 6–99.
