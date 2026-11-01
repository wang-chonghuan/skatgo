# SKATGO-168 plan

Found: the deal of the day's table leaves for /daily 1.8 s after its deal (`DEAL_OF_DAY_PAUSE`, SKATGO-131) — the
"flash"; its share lives in /daily's result. The avatar choice is already kept in the browser (checked on skatgo.com:
reload and a new tab keep it), but zustand stores every field with any setting, so SKATGO-167's defaults sit in many
browsers as if chosen, and a new default would not reach them.

1. The deal of the day's result keeps its dialog; its foot is share over close (`DodDone`, `Tournament.done`); the
   share code and sheet move into `dod-share.tsx`, used by /daily's result too. The timer goes.
2. Two avatars, the SKATGO-167 third-try method (style sample only, each face described); the picker in rows of four.
3. `DEFAULT_AVATAR` office lady / accountant; `avatars` holds only chosen seats; settings version 1 drops stored
   lina / noah as never chosen (`migrateSettings`, unit-tested).
