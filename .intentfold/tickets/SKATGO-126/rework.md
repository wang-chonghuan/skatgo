# SKATGO-126 rework

One rework round after the handoff (076c18c), its commit's first line the human's ask.

1. **The save button like the field** (9c75fd4) — 「你这个按钮的圆角和其他的按钮的圆角怎么不一样，按钮和输入框的高度也不同」. The
   settings' "Speichern" is a `block` button with the field's and the settings' cards' 12px corners, stretched to the
   field's height (46px); it was a 32px round pill. Rechecked by measuring both in the settings as the test account.

Net effect against the handoff: the nickname row's button matches its field.
