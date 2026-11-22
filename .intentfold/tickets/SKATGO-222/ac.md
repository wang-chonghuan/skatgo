# SKATGO-222 AC

Playwright on the production build (web 55222), PC 1280×820 and phone 375×812, English at `/en` and German at `/`
(each with its browser locale; the League card's title proves the language).

1. **Order** — the four colour cards in page order are league, daily, course, play.
2. **Colours** — computed backgrounds: daily `rgb(200, 40, 26)` (tileRed), play `rgb(0, 130, 26)` (tileGreen), league
   `rgb(2, 38, 87)`, course `rgb(229, 111, 0)`; each card's shadow carries its own colour.
3. **Same cards, same ways** — the daily card links to the daily page and shows its calendar icon and title, free play
   links to free play with its swords; their titles are unchanged.
4. **Live** — after deploy, on https://skatgo.com/en: the same order and colours (read in the browser).
