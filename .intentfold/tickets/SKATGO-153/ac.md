# SKATGO-153 acceptance checks

Acceptance plays no game (the human's standing rule), so a finished deal's dialog is not reached by script.

1. Folded card with the old play record: the restored `TrickReplay` is the removed one line for line (diff against
   `d7d924f^`); `PlayRecord` renders it closed under the trick in `VsAiReview`, which every after-deal review uses (code);
   the human opens it after a deal on the preview.
2. No hint at free play or the tournament: unchanged code paths (`hints` switch untouched); grep shows no hint control
   added.
3. en/de messages present (typecheck compiles them); the built pages load on 375×812 and 1280×820 with no sideways scroll;
   the human's look at the opened card on a phone.
