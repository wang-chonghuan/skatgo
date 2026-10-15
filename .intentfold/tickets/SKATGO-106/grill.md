# SKATGO-106 grill — self-adjudicated (Grill: self; the human: 「不用grill，修了马上上线」)

1. **How late may a waiting sound still play?** Recommendation: 1200 ms — the deal's dealing lasts about
   that long, so the riffle still matches what is on screen; beyond it, silence. **Answer: 1200 ms.**
2. **Prefetch on every page, or only table pages?** Recommendation: every page — 15 KB, and the tap that
   opens a table comes from another page. **Answer: every page.**
3. **Create the AudioContext at page load or at the first gesture?** Recommendation: first gesture — a
   context made outside a gesture starts suspended on an iPhone and Chrome logs a warning; made inside
   the tap it starts running. **Answer: first gesture.**
4. **New registry value `sound.late` (ui.md Redline 1).** The fix needs it; the human ordered the fix
   shipped without questions. **Answer: added, reported in the handoff.**
5. **Premise probe:** the current production page plays no deal sound on the first deal — checked as the
   control in ac.md 1.
