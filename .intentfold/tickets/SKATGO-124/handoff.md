# SKATGO-124 handoff

Forum posts and comments come in the reader's language: machine-translated once per text and language by the site's
model, kept in one table, the text as written one small tap away.

## What changed

- **The table** — `multiplayer/src/store.ts`: `translations (hash, lang, source_lang, text, created_at)`, primary key
  (hash, lang); hash = sha256 of the text as written. Any text anywhere is looked up the same way; nothing ties it to
  the forum's tables.
- **The translating** — `multiplayer/src/translate.ts` (new): `translationsOf` reads what is known for a page's texts
  in a language and queues what is missing; `translateForAll` queues a new text for both languages. A queue translates
  one text at a time in the background with `gpt-5.6-luna`, effort low, JSON answer (`from`, `text`); marks, link
  addresses, card rows, @names, numbers and the Skat words the site keeps German are kept; a text already in the
  language, or saying it in both side by side, stands as written. Without `LLM_BASE_URL` / `LLM_API_KEY` nothing is
  queued.
- **The forum service** — `multiplayer/src/forum.ts`: list and post take `lang`; summaries carry `translated`
  (source, title, excerpt; on the post page its body), comments `translated` (source, body); create and comment
  queue the new text.
- **Shared types** — `app/src/lib/forum.ts`: `FORUM_LANGS`, `translated` fields; the comment on translation updated.
- **The web** — `app/src/lib/forum-api.ts` reads in the page's language; `forum-page.tsx` shows titles and excerpts
  in the list in it, and on the post page the post and each comment, with `Translated`: "Automatisch übersetzt" and
  a very small underlined button "Original anzeigen" / "Übersetzung anzeigen" — a post's under its line of facts, a
  comment's under its text; `routes/forum_.$post.tsx`: the page's title, description and structured data follow.
- **Messages** — `forum_translated`, `forum_show_original`, `forum_show_translation`.
- **Charter** — product, engineering, ui, operations; also the two lines that still named the old Skat-Tricks
  article page (product, ui).

## AC results

1. **The other language shows translated.** PASS — German page of the English post: German title and body; English
   page of the German post: English title and body; its English comment in German on the German page (`tmp/ac.mjs`,
   headed Chromium, 1280×820).
2. **It says so; the original one tap away.** PASS — the line on the post and the comment; "Original anzeigen" shows
   the text as written, again the translation.
3. **Same language: as written, no line.** PASS — the German post on the German page; the English comment on the
   English page.
4. **Translated once.** PASS — reopening every page (lists and posts, both languages): 14 rows before, 14 after; no
   (hash, lang) twice.
5. **Model down: as written.** PASS — service without the keys, a new English post on the German page: 200, as
   written, no line, nothing stored.

Mechanical defence: typecheck, build, 282 unit tests, client bundle, design tokens, literal check, server bundle link,
`check:seo --built`, `test:seo` — pass. `npm --prefix multiplayer run check` — pass (its tests run without model keys).

## Deviations

None from `plan.md`. The look through the human's eyes moved a post's line from under its text to under its line of
facts (under a long article nobody would find it) and made the model translate card names (it had kept "Bube" in
English, where the site says Jack).

## Environment

Ports: web 55124, multiplayer 56124, database 57124 (local container; the three live forum posts copied, an English
comment and a test post added). Added: `LLM_BASE_URL` and `LLM_API_KEY` on the **multiplayer service in production**
(the web's values). Locally `multiplayer/.env` is unchanged — the review service gets the two from `app/.env` at
start — so nothing syncs back.

## Residual

- The forum list shows the same Skat-Tricks article twice in each language (posts 2 and 3 are its German and English
  versions); hiding one per language would be its own ticket.

## Check

1. http://localhost:55124/de/forum/3-skat-tricks-12-tricks-that-make-you-a-better-player-right-aw — the small line
   "Automatisch übersetzt · Original anzeigen" under the facts; whether "Automatisch übersetzt" should go, leaving only
   the small button (the look through your eyes thought you might want that).
2. http://localhost:55124/de/forum/2-skat-tricks-12-tricks-mit-denen-du-sofort-besser-spielst — the German post as
   written, its English comment in German with the line under it.
3. http://localhost:55124/en/forum/2-skat-tricks-12-tricks-mit-denen-du-sofort-besser-spielst — the German article in
   English.
4. http://localhost:55124/de/forum — titles in German.

## Decided for you

- Translated in the background — when written, into both languages; an older text when first shown. The page never
  waits; until then the text shows as written.
- The pages are rendered with the translation, so search engines read each language's page in its language.
- The multiplayer service calls the model (it owns the forum's rows) and gets the web's two LLM keys.
- The list shows translated titles and excerpts without the line; the line is on the post page.
- Kept as written: marks, link addresses, card rows, @names, numbers, Grand, Null, Hand, Schneider, Schwarz, Ouvert,
  Matador, Ramsch, Bock, Kontra, Re, Skat; card and suit names are translated.
- A text that already says it in the reader's language beside another (your bilingual announcement) stands as written.
