# SKATGO-28 acceptance checks

Checked against the built server on port 55028. Playwright runs headed, at 1280×820 and 375×812.
Each case starts from a fresh context with a set `Accept-Language`.

## AC1 — no Chinese anywhere

For both `en` and `de`, crawl every route from the route manifest, plus lesson steps 1–3 and the table.
Pass when every one of these holds:
- no rendered text contains a CJK character (`\p{Script=Han}`);
- the language menu offers exactly English and Deutsch;
- `hreflang` links list `en`, `de` and `x-default` only;
- `sitemap.xml` has no `/zh`;
- `/zh` and `/zh/course` answer the Q1 redirect to their `/en` counterparts, and `/zh/play` ends on
  the English table.

## AC2 — the language rule

Open `/` fresh with each `Accept-Language` and check where it lands:
- `de-DE,de` → `/de`;
- `zh-CN,zh` → `/en`;
- `en-US` → `/en`;
- `fr-FR` → `/en`;
- none → `/en`.

Then choose Deutsch in the menu, clear the address and reopen `/`: it lands on `/de`. A cookie set to
`zh` with a German browser lands on `/de`.

## AC3 — the front page is otherwise unchanged

- The facts strip's languages item reads "English · German" / "Deutsch · Englisch"; its element and
  styles are unchanged from `main`.
- The hero (eyebrow, headline, lead, buttons) has the same text as on `main` in both languages.

## Also run

- The mechanical defence.
- The operations post-deploy route check locally, deriving locales from the new settings: it finds 2.
