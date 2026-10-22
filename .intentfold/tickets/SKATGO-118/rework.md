# SKATGO-118 Rework

Three rounds after the first delivery (`handoff.md`), each asked by the human in review and committed once.

## Round 1 — one forum for both languages (`fbeed70`)

Ask: 「rework, 德语和英语论坛不要分开。别的这类论坛是如何做的，你先查查」, then, after the research
(Lichess, Flarum's and Discourse's own forums, Discourse's content localization, per-language boards):
「论坛的基本文字，还按当前的i18n，区分德语和英语。然后论坛里，别人想发什么 语言就发什么语言，未来会给每个帖子和回复下面
加上翻译选项，但是目前不加这个」. The live ticket's Request, Scope, Constraints and criteria 1 and 7 were amended.

- Posts no longer carry a language: no `locale` column, list, create or announcement filter by it; both
  interfaces list the same posts, the page's words in the site's language.
- A post stands at `/de/forum/…` and `/en/forum/…`; the forum sitemap lists both with the usual alternates
  and German x-default (`sitemapXml` shared with `/sitemap.xml`); the one-language head option is gone.
- Post titles and descriptions get a per-language suffix, so the two addresses do not share a title.
- The announcement line shows the newest announcement in both languages.
- SEO checker: forum posts pass the same language-coverage rules as every page; the negative control is now
  a post at a wrong address. Charter (product, engineering), READMEs, tests updated.

Rechecked: all 10 criteria (`tmp/ac.mjs`), `check:seo` with posts (3 posts × 2 addresses), `test:seo` 28/28,
`npm --prefix multiplayer run check` 27/27, unit tests, bundle, tokens, literal grep, SSR link. The local
forum tables were dropped and recreated for the new schema (production has none yet).

## Round 2 — no lead, a button beside the title (`38c6ef5`)

Ask: 「News from SkatGo, articles about Skat and room for your questions, ideas and feedback. 这一行不要，sign in
放在 Forum 的旁边，放个按钮就行」.

- The lead under "Forum" is gone; beside the title, one `go` button: "Anmelden"/"Sign in" for a guest,
  "Neuer Beitrag"/"New post" for a player (the composer opens under the title).
- The empty and not-reachable lines now say what the forum is for, so the list keeps enough visible text
  for the SEO rules when it has no posts.

Rechecked: all 10 criteria, `check:seo` with and without the forum running, typecheck, tokens.

## Round 3 — every post and comment in a card (`b3a13fe`)

Ask: 「每一个帖子或回复，都放在卡片里」.

- On a post's page the post itself (title, facts, text, actions) is in a white card, as each comment already
  was; the list's posts were already cards.

Rechecked: all 10 criteria, `check:seo` with posts, typecheck, tokens; desktop and phone looked at.

## Net effect against the handoff

One forum for both languages instead of one per language; posts have no recorded language and two
addresses; no lead on the list, the way to write beside the title; the post in a card. Everything else in
`handoff.md` stands. Still open for the human: a taller fixed text box (needs a size token), and the white
background of the Skat-Tricks and legal pages.
