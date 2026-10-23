# SKATGO-124 plan

## What the code already says

- The forum's rows live in the multiplayer service's PostgreSQL; the web asks it as the viewer and renders the list
  and the post on the server (`forum-api.ts`), the browser through `/api/forum`. Nothing records a post's language
  (`lib/forum.ts`: 「Translating them is for later」).
- The site's model is reached as `app/src/lib/ask/azure.ts` does: Azure OpenAI's OpenAI-compatible
  `/chat/completions`, `LLM_BASE_URL` / `LLM_API_KEY`, model `gpt-5.6-luna`. Only the web has those keys.
- A post's text carries marks (headings, lists, **bold**, links, card rows `[♠A ♠10]`) and Skat's German words.

## Route

1. **One table, keyed by the text** — `translations (hash, lang, source_lang, text, created_at)`, primary key
   (hash, lang), hash = sha256 of the text as written. Any text anywhere is looked up the same way; the same words are
   never translated twice; a changed text is a new key. `text` is the text in `lang` (as written when `source_lang`
   is `lang`). Nothing else.
2. **The service translates** — `multiplayer/src/translate.ts`: reads what is known for a page's texts in the reader's
   language; what is missing is queued and translated one at a time in the background by the site's model (luna,
   effort low, a JSON answer: the source language and the translation, nothing when it is already in that language),
   then stored. A new post or comment is queued for both languages as it is written. The page shows the text as
   written until its translation exists. The multiplayer service gets `LLM_BASE_URL` / `LLM_API_KEY`.
3. **The answer carries it** — list and post take the reader's `lang`; each summary, post and comment carries
   `translated` (the source language and the text in the reader's language) when its language differs.
4. **The pages** — the list shows titles and excerpts in the reader's language; the post page shows the post and each
   comment translated, with one small line under it: "Automatisch übersetzt · Original anzeigen", a link-like button
   that switches to the text as written and back. The post's `<title>` and description follow the page's text.
5. **Charter** — product (the forum in the reader's language), engineering (the table, the service's model call),
   ui (the small line), operations (the multiplayer service's two LLM keys).
