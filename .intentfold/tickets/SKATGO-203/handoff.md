# SKATGO-203 handoff

## What changed

- 首页（`app/src/components/skat/entry-page.tsx`）：卡片之下、页脚之上加一行 `entry-listed`："Listed by" / "Gelistet bei"（slate），后接 24px 方框里的英国国旗和粗体 `info` 链接 "The British Skat Association"，新标签页打开 https://weddslist.com/skat/servers.html。样式全用现有 token（`dims.badge`、`radii.tag`、`hairline`、`imageDim`、`space.x8/x24/x32`），没有新 token。
- 图片 `app/public/friends/bsa.webp`：80×80 白底英国国旗，画法同页头英文国旗的英国半边。
- 文案 `home_listed_by`、`home_listed_bsa`（en/de）。
- charter `ui.md`：首页一段加这一行；About 页推荐网站一句注明首页只有这一条外链。

## AC results

1. 通过：/en 与 /de 在 360、390、1280px 下 `entry-listed` 显示 "Listed by The British Skat Association" / "Gelistet bei The British Skat Association"，图片加载（naturalWidth 80），位于最后一张图片卡之下、页脚之上。
2. 通过：链接 href = https://weddslist.com/skat/servers.html，target=_blank，图片在同一链接内。
3. 通过：360、390、1280px 横向溢出均为 0，这一行在视口内。
4. 通过：/en/about、/en/daily、/en/rules 上没有这一行。

机械防线全过：typecheck、build、346 个测试、client bundle、design tokens、literal grep、SSR link、check:seo --built（52 个可索引页）、test:seo。

## Deviations

- 图片从计划中的协会网站橡子图换成英国国旗：交付前旁观评审指出橡子是德国牌花色，配 "British" 信号相反，像素图也和站内画风不符。plan.md 与 grill.md 已注明。

## Environment

- 端口：web 55203。没有新增、修改或删除环境变量。

## Residual

无。

## Check

1. 图片：协会没有 logo，现用英国国旗。不满意可换成协会网站的花色图，或者不放图。
2. 文案 "Listed by" / "Gelistet bei"，位置在首页最底部。

## Decided for you

- 协会没有 logo（网站只有花色小图，没有 favicon），用英国国旗代替。
- 协会名两种语言都用英文原名 "The British Skat Association"。
- 只放首页底部，不进每页页脚；链接正常 follow，新标签页打开。
