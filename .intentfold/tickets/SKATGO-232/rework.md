# SKATGO-232 rework

Two rounds after the handoff, each one commit.

## 1. One profile (a19eb6a)

The human: 「这里的 your profile，有两个，混乱。……一个profile页面，放在setting的第一个大按钮。然后内容就合并当前的profile和skat
profile，skat profile里的每周分析，删掉，去掉这个功能。」

- Settings open with one big `go` button, "Your Skat profile", for everyone; the nickname field and the profile and
  delete-account links left the settings.
- /profile carries the nickname (field and Save, as the settings had it) under the avatar, and "Delete account" at
  the foot.
- The weeks' analyses are gone: the cards, the API's `notes`, `weeksOf` and its types, the four messages, the tests,
  and the `profile_notes` table (the migration drops it; forget.ts no longer lists it). The 12 production rows were
  backed up first to the main checkout's `.intentfold/tmp/SKATGO-232/profile_notes-backup.json`.
- Rechecked: settings' first control is the profile button and leads to /profile; the nickname saves there
  (the forum reads the new name); no weeks; the delete link; no sideways scroll at both sizes; multiplayer
  `profile`, `forget`, `forum` tests.

## 2. Mention row padding (7215f52)

The human: 「这个地方头像的左边距不对，太小了」 — a mention row's hover ground started at the avatar.

- Each row takes `space.x12` inside on both sides. Rechecked: the avatar sits 12 px in from the row's edge.

## Net effect against the handoff

Everything in handoff.md stands, except that the settings no longer hold the nickname (it is on /profile) and the
record of play no longer has weekly analyses.
