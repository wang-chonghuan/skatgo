# SKATGO-203 AC

1. 英文和德文首页最底部（页脚之上）显示 "Listed by" / "Gelistet bei" 加协会图片和 "The British Skat Association"。
   查：playwright 打开 /en 和 /de，`entry-listed` 可见，文字和图片都在，位置在最后一张卡片之下、页脚之上。
2. 点击协会名或图片，在新标签页打开 https://weddslist.com/skat/servers.html。
   查：链接 href 为该地址，target=_blank，图片在同一个链接里。
3. 手机宽度（360px）和电脑宽度下这一行完整显示，页面不能左右滑动。
   查：360、390、1280px 下 scrollWidth − clientWidth = 0，这一行在视口宽度内。
4. 其他页面不出现这一行。
   查：/en/about、/en/daily、/en/rules 上没有 `entry-listed`。
