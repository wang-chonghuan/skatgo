# SKATGO-213 acceptance check

Against the ticket's services (web 55213, multiplayer 56213, database 57213), production builds. Data seeded into the
ticket database only (six accounts, one per League tier).

1. **Bronze, silver, gold one medal.** Decode each card picture the page loads: the medal region of the silver and gold
   cards has the red ribbon and the medal's metal (silver grey, gold yellow), no laurel (the silver card's old one) and
   no blue ribbon; bronze's card is the one shipped. Screenshot of the six cards.
2. **Platinum, Diamond, Legend.** Platinum's card has teal shield pixels and a white star; Diamond's diamond is darker
   than the shipped card's; Legend's card has the orange cup and its glow, and none of the crown's laurel green.
3. **Unchanged around them.** Each card's ground: outside where the emblems stand, the picture equals the shipped one (no
   pixel off by more than WebP noise). Its sparkles: as many as on the shipped card, none under the new emblem (one the
   emblem would cover moves clear of it). The cards' size and words: EN and DE, 375 and 1280 — six
   cards, the picture filling each card, the name and fee inside it, each card's size and each line count the same as
   on the base build (German fees already wrap to two lines on a phone there).
4. **A device that kept the old pictures.** One browser profile opens the League page and the home page on the base
   build (919ea8d) until the service worker controls them and holds the old pictures; the server is then switched to
   this build on the same address. Opening the same pages again in that profile shows the new pictures at once — the
   cards and the badges equal this build's files, on the first load.
