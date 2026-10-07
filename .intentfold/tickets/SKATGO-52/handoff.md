# SKATGO-52 handoff

## What changed

**Lesson pages aimed at search words** (`app/src/lib/skat/lessons/guide.de.ts`, `guide.en.ts`)
- All 11 German lessons have a new `question` (the title before " – Skat-Lektion n | SkatGo"), `h1`, `description` and intro. Each lesson's main word is in all three of title, description and h1.
- The intros stay 100–200 words and say only what the lesson teaches.
- Lesson 10's intro now carries "Skat Tipps" and lists the "Todsünden" the lesson drills:
  - Aces before the trumps are out;
  - a defender leading trumps;
  - not smearing the partner, or giving the declarer a 10;
  - a high trump from last seat;
  - not counting trumps.
- English lesson 1 is the English entry page: "How to Play Skat: the Skat Card Game Explained", h1 "How to play Skat, the card game for three".
- English lesson 10's title changed to "Skat Tips: Playing Well as Declarer and Defender", so that "How to Play Skat" stands in one English title only.
- Slugs (addresses) are unchanged.
- Preview images were redrawn by SKATGO-50's `og.mjs` for the lessons whose h1 changed: German 1, 2, 3, 4, 6, 8, 9, 10, 11 and English 1. Lessons 5 and 7 kept their h1, and their images are byte-identical.

**Lesson page order** (`components/skat/lesson-page.tsx`, human's grill Q10)
- Under the h1 come only the kicker ("Lektion n von 11, etwa x Min.") and the lesson's own `promise`, then the interactive lesson at once.
- The intro follows the lesson, visible, under an h2 "Kurz erklärt" / "In short" (new message `lesson_in_short`), then the existing ways on.
- Without JavaScript the reading order is h1 → promise → intro, since the player renders only in the browser.

**Charter** (human-authorized at the start of the ticket and in grill Q9/Q10)
- `product.md`: the daily tournament sentence describes SKATGO-48's comparison:
  - a row with both Seeger-Fabian scores, roles and the difference;
  - opened, both deals in full;
  - the newest row open after a deal and mid-day.
- `engineering.md`: a key decision for `DealSummary.detail` (SKATGO-48: written when a deal ends, read as stored, no compatibility replay), and the `daily-comparison.tsx` row names `VsAiTable`.
- `ui.md`:
  - the widget table gains `VsAiTable`;
  - the sub-page rule says a lesson starts playing at once and its explanation follows it.

## Keyword → page

Each word below appears in exactly one page title, among all 38 indexable pages; this was checked.

| Search word | Page |
|---|---|
| wie spielt man Skat, Skat (kurz) erklärt | `/de/kurs/wie-funktioniert-skat` |
| Skat Kartenwerte, Punkte zählen (description, intro) | `/de/kurs/welche-karte-zaehlt-wie-viele-augen` |
| Trumpf-Reihenfolge, Buben-/Farben-Reihenfolge (intro) | `/de/kurs/was-ist-trumpf-beim-skat` |
| Bedienen beim Skat | `/de/kurs/wie-bedient-man-beim-skat` |
| Grand und Null, Nullspiel (description, intro) | `/de/kurs/was-sind-grand-und-null` |
| Spielwert berechnen | `/de/kurs/wie-berechnet-man-den-spielwert` |
| Reizen beim Skat, Skat reizen erklärt, Reihenfolge (description) | `/de/kurs/wie-reizen-funktioniert` |
| Skat drücken, Handspiel (description) | `/de/kurs/was-tun-mit-dem-skat` |
| Skat Abrechnung | `/de/kurs/wie-rechnet-man-skat-ab` |
| Skat Tipps, Tricks, Todsünden | `/de/kurs/wie-spielt-man-gut-skat` |
| Skat üben | `/de/kurs/bereit-fuer-eine-echte-partie` |
| Skat Regeln; Null ouvert, Ramsch (description, anchors) | `/de/regeln` (SKATGO-50) |
| Reiztabelle, Reizwerte | `/de/regeln/reiztabelle` (SKATGO-50) |
| Skat spielen lernen, für Anfänger | `/de/kurs` (SKATGO-50) |
| Skat kostenlos spielen, ohne Anmeldung, ohne Werbung | `/de/spielen` (SKATGO-50) |
| how to play Skat, Skat card game | `/en/course/how-does-skat-work` |
| Skat rules | `/en/rules` |
| learn to play Skat | `/en/course` |
| Skat Punkte aufschreiben | not used; left to SKATGO-53 |

## AC results

`tmp/ac.mjs`, headed Chromium, built server on 55052, multiplayer on 56052 and database on 57052: 51/51 pass.

1. **AC1**: each of the 11 German lessons has its main word in the title, description and h1, and its intro (over 100 words) is in the server HTML, read with JavaScript off.
2. **AC2**: lesson 10's title is "Skat Tipps: Tricks und die häufigsten Todsünden …", and every Todsünde it names is a step or exercise of lesson 10 (`content.de.ts`).
3. **AC3**: the English lesson 1 title and h1 both contain "How to play Skat"; the title also contains "Skat Card Game".
4. **AC4**: the 22 words of the table, each checked against all 38 sitemap pages' titles, appear only in their owner's title.
   - The first run failed: English lesson 10's title "How to Play Skat Well …" also held "How to Play Skat". It was retitled, and the affected checks rerun (tests 83, `check:seo` 38 pages).
   - The course lists 11 lessons at 1280 and 375.
   - On lessons 1, 10 and 11 at both widths: no horizontal scroll, the lesson starts within the first screen, and the intro sits below it.
   - Lesson 2's first exercise judges the answer "10" as right.
   - Lesson 11 deals a game.
   - The mechanical defence passed in full before the fix: typecheck, build, 83 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built` 38 pages, `test:seo`.

## Deviations

- Scope added by the human during the grill (Q10): the intro moved below the lesson. This is recorded in the ticket comment; the AC are unchanged.
- English lesson 10's title changed, which is not in plan.md, to keep "How to Play Skat" unique (see AC4).
- OpenSEO tags were not set: no OpenSEO tool in this session (grill Q8). The table above is the input.

## Environment

- Ports: web 55052, multiplayer 56052, database 57052.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` point at ticket ports for local acceptance only.
- No env key added, changed or removed.

## Residual

- Tag the table's words in OpenSEO (page-lesson-n) for rank tracking.
- After release, request indexing for the changed lesson pages in Search Console and Bing (operations.md).
