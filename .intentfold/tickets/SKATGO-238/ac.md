# SKATGO-238 acceptance checks

1. Start 1000 — unit tests of the lines and `standingAfter` (1000 / 2000 / 0, moves start at 1000); running product: a
   fresh test account opening /league is Bronze 1000, the About text reads "starts you at 1000 … At 2000 … at 0";
   a restart's migration leaves an existing row's points as they were.
2. Phone lock — running product, a seated League table (Playwright, no deal played by me): freeze the page (CDP
   lifecycle "frozen"), break its connection (restart the multiplayer service, so its reconnection tokens are gone),
   unfreeze: the table is back without "Reconnecting …" within a few seconds. Then a hung entry: make the ticket request
   hang once and break the connection: it recovers after the entry's time-out. Before the fix the same script shows the
   stuck state (reproduced first).
3. Avatars — running product, the League table: both opponent seats show a picture where free play shows its faces;
   a test account with a drawn avatar sitting against personas sees the personas' name drawings; screenshot.
