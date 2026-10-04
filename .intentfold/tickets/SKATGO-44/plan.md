# Implementation Route

## Observed Contracts

- The shared Paraglide patterns own localized addresses; the router rewrites all navigation through them. The root currently redirects using request preferences. Other German addresses already use translated paths.
- Static pages already render through client-page; only exercises, tables and personal tournament state need ClientPart. Free play currently emits a hidden H1 and no copy or links.
- The table must remain directly usable at its existing full-screen geometry. Free play can retain its first-screen table and expose a reading section below it, rather than resize the game.
- Daily landing only emits changing date placeholders. Its actual rules are server-owned and can be described statically without exposing deals or player records.
- Sitemap lists the private daily execution page. Every page incorrectly uses the homepage as x-default, even when its other alternates are lessons or rules.
- Unknown lesson slugs redirect to the course instead of identifying a missing page.
- Product/engineering/operations charters contain replaced language and SSR assumptions. User expressly authorizes relevant corrections.

## Slices

1. German root pattern and request locale; permanent legacy-home redirect; shared page-specific default alternate. Retain other German URLs.
2. Static free-play and tournament reading content using current tokens and real product behavior; contextual home/course links. Table remains first and functional. Personal daily execution is noindex.
3. Accurate Game/WebPage metadata and shared indexable route policy; proper not-found handling. A shipped-site checker parses the actual sitemap and every page in a browser with JavaScript disabled, verifies indexability, language, canonical, reciprocal alternates, text/links, assets and metadata. Derivation must be nonempty.
4. Authorized charter corrections and post-release checks, preserving the exact live-commit gate. Record GSC baseline and pending actions.
5. Mechanical defence and headed desktop/mobile acceptance through cap3handoff. Review delivery, no merge or release.

No dependencies, infrastructure, game engine, model, schema, player data or production environment changes are planned.
