# SKATGO-203 plan

代码里已有、工单没说的：
- 首页（`entry-page.tsx`）在卡片下面没有别的东西，再往下就是每页都有的页脚（`legal-footer.tsx`）。
- About 页的"推荐网站"（SKATGO-198，`lib/friends.ts`）已有外站图片的样式：24px 方框（`dims.badge`、`radii.tag`、`hairline`、`imageDim` 底），图片放在 `public/friends/`，80×80 webp。
- 协会网站没有 logo、没有 favicon；首页边框上是法国牌和德国牌花色的小 gif。

路线：
1. `public/friends/bsa.webp`：英国国旗（与页头英文国旗的英国半边同一画法），白底 80×80，与其他外站图片同规格。（起初用协会网站的德国牌橡子图，见 grill 1。）
2. `entry-page.tsx`：图片卡下面加一行（`data-testid="entry-listed"`）：slate 的 "Listed by" / "Gelistet bei"，然后链接（24px 图片 + 粗体 `info` 的 "The British Skat Association"），新标签页打开 https://weddslist.com/skat/servers.html。样式全用现有 token，不加新 token。
3. 文案：`home_listed_by`、`home_listed_bsa`（en/de）。
4. charter ui.md 首页那段加一句这一行，并注明 SKATGO-198 的"外链只在 About"对这一条例外。
