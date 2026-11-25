# SKATGO-237 acceptance checks

1. Lines on the page — sign in as a test account (Bronze, Silver via DB), open /league: the lines read
   "Promotion at 2000 · Relegation at 0", the bar's fill equals points/2000; in Legend no promotion line, no bar.
2. Promotion at 2000 — set a Silver test player to 1990 in the ticket DB, finish one League deal that brings them to
   ≥2000 (or apply `standingAfter` through the service's deal settle path): tier becomes Gold, points 1500.
   Checked by the unit test of `standingAfter` plus a DB read after a settled deal on the running service.
3. New player — a fresh test account opening /league sits in Bronze at 1500.
4. Unchanged relegation — unit test: non-Bronze to 0 goes down and starts at 1500; Bronze stops at 0; Legend runs past 2000.
5. Existing points unchanged — the multiplayer migration on start leaves `league_players` tier/points/scale as they were
   (compare a row before and after restart in the ticket DB).
