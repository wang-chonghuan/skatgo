# SKATGO-224 AC

Playwright on the production build (web 55224), PC 1280×820 and phone 375×812 (and 320, for the ribbon), English at
`/en` and German at `/` (each with its browser locale; `<html lang>` and the League card's title prove the page).

1. **Order** — the four colour cards in page order: daily, play, course, league.
2. **Colours** — daily `rgb(0, 130, 26)`, play `rgb(200, 40, 26)`, course `rgb(229, 111, 0)`, league `rgb(2, 38, 87)`;
   each card's shadow starts with its own colour.
3. **League keeps its ribbon and cup** — the League card has the "Hot" ribbon (its four corners at least 4px outside the
   card) and the gold cup; no other card has a ribbon.
4. **Same for everyone** — a signed-in visit (local test account cookie, operations.md) shows the same order and colours.
5. **Live** — after deploy, on https://skatgo.com/en: the same order and colours.
