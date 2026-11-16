# SKATGO-203 AC（返工 5 后，与工单一致）

1. 英文和德文 About 页显示 "Featured on" / "Bekannt aus" 一节，含英国国旗图片和 "The British Skat Association"。
   查：playwright 打开 /en/about、/de/about，`about-featured` 文字和图片（加载成功）。
2. 点击协会名，在新标签页打开 https://weddslist.com/skat/servers.html。
   查：链接 href 与 target=_blank。
3. 手机宽度（360px）和电脑宽度下 About 页不能左右滑动。
   查：360、1280px 下 scrollWidth − clientWidth = 0。
4. 首页没有这一节，也没有任何外部链接，与改前一样。
   查：/en、/de 首页 main 内无外部链接；entry-page.tsx 与 base 无差异。
