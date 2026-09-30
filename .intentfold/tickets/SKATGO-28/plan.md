# SKATGO-28 plan

## What the code says that the ticket does not

- **Languages come from one place.** `app/project.inlang/settings.json` lists `en`, `de` and `zh`,
  with `en` as the base. Paraglide generates the runtime from it, and the router, the language menu,
  the `hreflang` links and the post-deploy check all derive from that list.
- **Chinese is the course's reference text.** The English and German courses say they match
  `content.zh.ts`. `lessons.test.ts` compares each course with the Chinese one (ids, minutes, steps).
  The reference moves to English.
- **The language rule already never infers Chinese** (SKATGO-23). Chinese is reached only by a `/zh`
  address or a saved `zh` cookie; both go away.
- **Search engines have indexed `/zh/...`.** `public/sitemap.xml` lists 12 Chinese addresses (grill Q1).
- **The charter says three languages.** `product.md` lines 16 and 36–38 say so, and `operations.md`
  line 196 names `/zh` in prose. These are human-owned (grill Q5).

## Route

1. **Locales.**
   - Remove `zh` from `project.inlang/settings.json`.
   - Delete `messages/zh.json` and `lib/skat/lessons/content.zh.ts`.
   - `content.ts` maps `en` and `de` only.
   - `site.ts` `LANG_TAG` drops `zh`.
   - The language menu's `NAME` map drops `zh`.
2. **Rule** (`lib/locale.ts`): the URL prefix, then the saved choice (`en` or `de` only; a stored `zh`
   counts as none), then German if the browser asks for it, then English.
3. **Old addresses** (Q1): `/zh` and `/zh/...` answer a permanent redirect to the same path under
   `/en`, in the server entry, before the language middleware.
4. **Sitemap**: `/zh` entries removed; `sitemap.test.ts` keeps checking every route in every remaining
   language.
5. **Tests.**
   - `lessons.test.ts` uses the English course as the reference.
   - `locale.test.ts` and `ask.test.ts` drop their Chinese cases. A stored `zh` resolves by the browser
     rule, and that is tested.
6. **Front page**: the facts strip's languages item drops Chinese ("English · German"); nothing
   else on the page changes (scope narrowed, see below).
7. **Comments** that name Chinese as the reference, or `/zh`, are updated in the files this ticket
   touches.

## Scope narrowed (2026-09-30)

The human: 「你这个工单先改为就把中文的去掉，其他不变，开始开发，然后直接关闭。」 The ticket in
Plane was rewritten to that scope: remove Chinese only. The hero copy, the "fully supported" line and
the slogan discussion (grill Q2, Q3) are dropped and left for a later ticket. The existing language rule
(URL → saved choice → German browser → English) stays; only Chinese leaves it. Q1 (301 from `/zh`) and
Q4 (a saved `zh` counts as none) are part of removing Chinese and stay as recommended.

## Redline lookup

- No dependency change.
- No token change.
- `product.md` is not edited by the agent (product Redline 2), see Q5.
- No production data. The redirect is code in the web server; no DNS or infrastructure change.
