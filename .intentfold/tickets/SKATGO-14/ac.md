# SKATGO-14 acceptance check plan (basic function only — no games)

Built server on port 55014 with `app/.env`, headed Playwright, fresh signed-out contexts.

1. `/zh`, `/zh/lesson/4`, `/zh/play` (+ en/de on one page each), desktop and phone: a round launcher
   bottom-right (appears after hydration); click → panel with the page title and three header buttons,
   launcher hidden; desktop floating panel inside the viewport, phone full-screen; Esc / close → panel
   gone, focus back on the launcher.
2. Ask on `/zh/lesson/4`, go to `/zh/play`, open → the conversation is there; reload → still there;
   "New conversation" → empty.
3. Copy → clipboard holds the conversation as text, button shows "copied", then returns; with an empty
   conversation New and Copy are disabled.
4. An answer arrives signed out; no horizontal scroll; no page errors; wheel over the panel does not
   scroll the page behind.
Mechanical defence per engineering.md.
