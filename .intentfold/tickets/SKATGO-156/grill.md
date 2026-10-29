# SKATGO-156 grill

## Decided for you (Grill: self — 「不用grill，直接开发」)

1. **Hand-over over Postgres NOTIFY**, not a stricter health check. *Basis:* a health check that waited for leadership would
   deadlock the first deploy, whose old instance cannot hand over; the NOTIFY path is additive.
2. **Icon `LayoutGrid`** on the header gear's round white button. *Basis:* 「图标你来选」; the dialog shows a grid of numbers.
3. **The tiles of the Skat-Tricks levels** for the numbers (mistake red, current ringed `go`, not reached shut). *Basis:*
   「要服从设计系统，要一致感强」 — the existing pattern for numbered exercises.
4. **"Cheat sheet" on a phone**: the full name and the seat do not fit one line at 375 px in the question's type.
5. **Daily toggles: chosen `go`, other `quiet`**, md. *Basis:* the app's standard buttons (ui.tsx: controls are 40 tall).
