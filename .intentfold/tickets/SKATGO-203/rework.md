# SKATGO-203 rework

handoff.md 冻结时：首页卡片之下一行 "Listed by" + 协会图片（英国国旗）+ 协会名。

1. 「为啥不用 featured on?」——解释了 "featured" 有被编辑挑选的含义；未改。
2. 「所有的这种外链引用都是featured on，我就没见有人写过listed by的」——英文改 "Featured on"，德文 "Bekannt aus"。复查：AC 1 文案、AC 3 溢出。
3. 「我觉得应该沉底到home页面的底部位置」——这一行贴到首页底部、页脚之上 20px，高屏时沉到屏幕底。复查：AC 1 位置、AC 3。
4. 「那个32 karten的，应该也放个链接到首页底部，就是论坛链接，用个合适的词，精简的」——加 "Discussed on" / "Diskutiert auf" 32karten（SkatGo 的论坛帖子）。复查：AC 1–3。
5. 人问放首页有没有用，agent 建议都放 About 页。人：「about页加上featured on英国这个协会。就这么改，home页不动。改完上线」——首页恢复原样（entry-page.tsx 回到 base，首页文案键删除，32karten 链接一并撤回），About 页推荐网站之后加 "Featured on" / "Bekannt aus" 一节：英国国旗、"The British Skat Association"、一句说明，链接协会的 Skat 服务器列表。工单 Scope/Constraints/AC 和标题随之更新。复查：新 AC 1–4 全部（About 英德两语 360/1280px，首页无外链）；最终分支机械防线全过。

相对 handoff 的净效果：首页不变；About 页多一节 "Featured on"。图片 `public/friends/bsa.webp`（英国国旗）保留给 About 页用。
