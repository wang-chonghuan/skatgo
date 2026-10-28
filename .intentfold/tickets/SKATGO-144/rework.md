# SKATGO-144 rework

Four rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「topbar上的那些菜单都删了吧，不需要了，本工单改」** (25b92d0). The header lost its six section links and, with them, the
   phone's menu: the mark and name, the flags, the gear and sign-in or the avatar on every width; under 360px the mark
   alone so sign-in fits (the link named SkatGo). The menu's code, styles and seven unused messages removed. Rechecked:
   the header at 1440, 375 and 320 wide, everything inside the bar; the mechanical defence (SEO internal links).
2. **「英国和德国国旗距离太近，请调整成正常距离」** (7201725). The flags 12px apart on PC, 10px on a phone, 8px under 360px.
   Rechecked: measured at the three widths, the bar still fits.
3. **「elo也在窄屏上也不能全高，仍然要限定高度，你思考限定多少」** (9a99265). Below 1024px the board's list five rows and a half
   tall (162px, `dims.eloListNarrow`), the cut row saying it scrolls. Rechecked: tablet and opened phone board.
4. **「……只要变成列式布局，就用现在那种横向滚动的。如果和横向布局，高度就跟着邻居来但是带纵向滚动条」** (97516fa). The board folds
   behind its sideways-running line wherever the page is one column (`bp.cards`), not only on phones; opened, five rows
   and a half. Rechecked: folded at 1000, 768, 375; side by side and aligned at 1100, 1440.

Net effect: the front page's Elo board as tall as its neighbours side by side, folded in one column; a header without
links or menu, its flags spaced.
