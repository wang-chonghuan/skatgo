# SKATGO-124 acceptance checks

1. **A post in the other language shows translated.** Playwright on the local review (web 55124, multiplayer 56124,
   database 57124, the model reached with the site's keys): an English post opened in German shows a German title,
   body and comment; a German post in English likewise, after its translation has been made.
2. **It says so, and the original is one tap away.** The small line under the post and the comment; tapping
   "Original anzeigen" shows the text as written, tapping again the translation.
3. **Same language: as written, no line.** A German post opened in German.
4. **Translated once.** The `translations` table holds one row per text and language; opening the post again adds
   none and calls the model no more (service log).
5. **Model down: as written.** With the model's keys removed the post shows as written, without the line, and the
   page answers 200.
