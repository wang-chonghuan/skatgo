# SKATGO-29 grill

Grill: human. The brief itself asks for a plan and confirmation before any code; this is that step.
Every question carries a recommendation and its reason.

## Q1 — the front page hero, now that Duplicate is out

The brief's hero is Duplicate throughout:
- state A's title, meta, H1, lead and primary button;
- the H1 A/B variant ("Skat, without the luck.");
- the result card;
- two of the three small-print items;
- states B and C.

Under the ticket's rule, copy that describes a missing feature is deleted or rewritten. That leaves
no hero copy from the brief except the secondary button.

**Recommendation: keep the current hero and change only what the brief and the rules require.**

- **H1:** unchanged — "Skat, anytime, anywhere" / "Skat – jederzeit, überall".
- **Lead:** drop the "soon" sentence.
  - EN: "Your computer opponents never leave the table — no third player to find, no waiting."
  - DE: "Deine Computergegner sitzen immer am Tisch: kein dritter Mann gesucht, kein Warten."
- **Primary button:** "Play now" / "Jetzt spielen", to free play (unchanged).
- **Secondary button** (from the brief, close in weight to the primary): "Never played Skat? Start
  here" / "Neu beim Skat? Hier starten", to the course.
- **Small print**, as three separate items with no middle dots:
  - "Opponents always ready" / "Gegner jederzeit bereit";
  - "Plays in your browser" / "Läuft im Browser";
  - "No sign-up" / "Ohne Anmeldung" — true, since accounts are optional.

  This replaces "English · German" (the header's menu already says so).
- **Result card and H1 variant switch:** not built.
- **Title and meta:** new, because the brief's are Duplicate.
  - EN title: "Play Skat Online Free – Learn and Play in Your Browser | SkatGo"
  - EN meta: "Learn Skat in {LESSON_COUNT} short interactive lessons and play free against two
    computer opponents, any time, right in your browser."
  - DE title: "Skat online kostenlos lernen und spielen | SkatGo"
  - DE meta: "Lerne Skat in {LESSON_COUNT} kurzen, interaktiven Lektionen und spiel kostenlos gegen
    zwei Computergegner, jederzeit direkt im Browser."

*Reason:* this is the smallest change that invents no product claim. When Duplicate ships, its
ticket brings the brief's hero back verbatim.

## Q2 — Duplicate links on the other pages

**Recommendation:**
- **Course page:**
  - drop "When you're done, join the daily: the same 12 deals for everyone." and "Then test
    yourself in the daily challenge.";
  - in German, drop "Danach wartet das tägliche Turnier: gleiche Karten für alle." and "Danach
    wartet das tägliche Turnier.";
  - the rest is verbatim, with 11 rendered from `{LESSON_COUNT}` ("elf"/"Eleven" become the number).
- **Completion view after the last lesson:**
  - H1 "You're ready." / "Du bist bereit." kept;
  - body and button replaced by the brief's own free-play copy: "Two computer players are ready
    any time, as often as you like." with "Deal me in", and "Zwei Computergegner sind jederzeit
    bereit, so oft du willst." with "Karten geben", pointing to free play;
  - `course_complete_cta_click` fires on that button.
- **Rules page:** "Learn it interactively" / "Interaktiv lernen" kept; "Play today's deals" /
  "Heute spielen" replaced by "Deal me in" / "Karten geben", pointing to free play.
- **Play page:** the Duplicate block below the table is dropped; the intro text stays verbatim.
- **"Every page links to today's Duplicate":** dropped. Instead, every page links to the course and
  to free play.

*Reason:* the replacements are copy the brief already approved for the same purpose, just aimed at
a feature that exists.

## Q3 — FAQ

**Recommendation:** keep five of the seven questions and answer them from the code.
- Kept: 1 free, 2 account, 4 scoring, 6 rules, 7 phone.
- Dropped (Duplicate only): 3 "When do the daily deals change?" and 5 "What does 'vs. AI' mean?".
- **Scoring (4):** a won game scores its value, a lost game minus twice its value. There is no
  Seeger-Fabian list scoring.
- **Rules (6):** the international Skat rules (ISkO). No Kontra/Re, no Ramsch (a hand everyone
  passes is dealt again), no Bock.

*Reason:* a question whose answer is "that doesn't exist yet" is the "coming soon" the brief bans.

## Q4 — URLs and slugs

**Recommendation:**
- **Localized paths:**
  - `/de/kurs`, `/de/regeln`, `/de/spielen`;
  - English `/en/course`, `/en/rules`, `/en/play`.
- **Lesson slugs:** one per language, each from the lesson's question. Examples: `/en/course/how-bidding-works`,
  `/de/kurs/wie-reizen-funktioniert`.
- **Old addresses:** 301 to the new ones:
  - `/en/lesson/7`, `/de/lesson/7`;
  - `/de/course`, `/de/play`.
- Progress keeps using lesson ids, so nobody's progress changes.

*Reason:* Paraglide's `urlPatterns` already supports a slug per language, so no fallback is
needed, and German slugs serve the German searches the brief targets.

## Q5 — token registries (ui Redline 1, needs your approval)

The new pages need values the registries do not have:
- the rules article's column and table-of-contents layout;
- FAQ and section spacing;
- the play page's H1 bar height;
- one or two typography roles that are not uppercase. The brief bans all-caps small labels, and
  the current section title role is uppercase.

**Recommendation:** approve **additions only** to `app/src/theme/` for these pages. Each is named
and commented in its registry, and no existing value is retuned. The list goes in the handoff.

*Reason:* the redline makes this your decision. Additions do not move any shipped page.

## Q6 — OG images

**Recommendation:** one 1200×630 PNG per page per language, 30 in all:
- front page, course page, 11 lessons, rules, play, each in en and de.

They are rendered from one HTML template (logo, the page's H1, three of the deck's cards on the
site's felt) by a Playwright script kept in the ticket folder, as SKATGO-23 did for icons, and
committed to `app/public/og/`. No new dependency.

*Reason:* distinct images per page satisfy "each page has its own", and static files cost nothing
at request time.

## Q7 — the leaked "www.me.uk/cards/"

It is the maker's text inside the deck's Ace of Spades SVG. The deck is CC0, so attribution is not
required.

**Recommendation:** the card renderer drops the deck's `<text>` elements. No Credits footer.

*Reason:* it removes the text everywhere the card appears (tiles, table, lessons), not only on
the front page.

## Q8 — `/` redirect

**Recommendation:** answer `/` with 302 and `Vary: Accept-Language, Cookie`. The existing rule
stays: a saved language choice first, then a German browser gets `/de`, and everything else gets
`/en`.

*Reason:* dropping the saved choice would send a German speaker who picked English back to German.
`Cookie` in `Vary` keeps caches honest about that.

## Q9 — play page layout

**Recommendation:**
- a compact H1 bar holds the page's H1 and the way back;
- the table fills the rest of the first screen at both viewports;
- the SSR intro text sits below the table, reached by scrolling.

*Reason:* this is the brief's own layout. The table stays at its current size minus the bar's
height.

## Q10 — events

**Recommendation:** a `track(event, props)` wrapper that captures only when PostHog has started
(skatgo.com). It fires `hero_cta_click`, `lesson_start`, `lesson_complete` and
`course_complete_cta_click`, each with `locale` and `page`:
- `hero_cta_click` adds `state: 'A'`, `variant: 'default'` and `button: primary | secondary`;
- `lesson_complete` adds `lesson`.

A test hook records the calls for the local check.

*Reason:* it reuses the existing PostHog setup (SKATGO-25), and the other eight events belong to
Duplicate.

## Q11 — authored text

**Recommendation:** I write, in both languages, from the course content and the engine:
- the 11 lessons' SSR intros (100–200 words each);
- their question-style titles, H1s and metas;
- the eight rule sections;
- the FAQ answers.

The handoff lists every rule detail I am not certain of, for your check.

*Reason:* the brief asks for exactly this, and the engine is the source.

## Q12 — charter drift (yours)

`ui.md`'s Contract still describes the card-room look and the four-tile front page with "coming
soon". `product.md` says three languages and "only the course".

**Recommendation:** I do not edit either. The handoff names the stale lines, and you update them.

## Answers

(pending)
