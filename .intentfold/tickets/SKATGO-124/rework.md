# SKATGO-124 rework

One rework round after the handoff (6609da7), its commit's first line the human's ask.

1. **One article, an English announcement, translated ahead** (5b5db4c) — 「12 个 Skat 技巧会出现两次。保留英文版。公告也
   保留英文版，德语用翻译的，但是提前做好」.
   - The German 12-tricks post (2) is hidden; its address and `/skat-tricks/12-tricks` in both languages lead to the
     English post (3), read in German as its translation.
   - The announcement (1) keeps only its English part, "Tell us what you think"; its German is the translation.
   - Both are data, `tmp/content.sql`, run in production at close.
   - The service translates everything the forum shows when it starts, skipping what is done (a lookup, no model).
   - The announcement line on the front page and /daily shows its title in the reader's language, cached per
     language.
   - Rechecked: the acceptance script (the German comment under the English article, the English announcement in
     both languages, the article once in the German list), the redirects, the translations made with no page view,
     typecheck, unit tests, multiplayer check, `check:seo`.

Net effect against the handoff: the forum shows one English 12-tricks article and an English announcement, both in
German for German readers, translated before anyone opens them.
