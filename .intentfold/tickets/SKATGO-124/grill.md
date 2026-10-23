# SKATGO-124 grill

The human settled the open questions when starting development: Azure OpenAI, luna, effort low or medium; a table as
extensible as possible but above all simple; the original behind a very small link-like button. No other question
passed the bar.

## Recommendations you approved

1. **Which translation service?** Azure OpenAI, the site's own deployment — 「Azure OpenAI 同意用这个，用luna low就行，
   或者medium」. Effort low.

## Your decisions

2. **The table** — 「这个表要设计的尽量可扩展性强，但是最重要的是简洁，千万不要过度设计」: one `translations` table keyed by the
   text's hash and the language, nothing tied to the forum's tables.
3. **The original** — 「用户可以点击查看原文，有个非常小的链接式的小按钮」.

## Decided for you

4. **When is a text translated?** In the background: when written, into both languages; an older text when first
   shown. The page never waits for the model; until the translation exists the text shows as written. Basis: a long
   post takes the model many seconds; a page must not.
5. **Does the translation go to search engines?** Yes: the page in each language is rendered with the text in that
   language, as it shows to readers. Basis: the human — 「看到的都是他ui上的语言的翻译版」; the pages are already per
   language.
6. **Which service calls the model?** The multiplayer service, which owns the forum's rows; it gets the web's two
   LLM keys. Basis: one owner for the forum's data; the web stays a pass-through.
7. **The list** shows translated titles and excerpts without the line; the line and the button are on the post page,
   under the post and under each comment. Basis: a list card has no room for it; the original is one tap away there.
8. **What is kept as written?** The marks, links' addresses, card rows, @names, numbers and the German words of the
   Skat table (Grand, Null, Hand, Schneider, Schwarz, Ouvert, Ramsch, Bock…). Basis: ui.md's content rule.
