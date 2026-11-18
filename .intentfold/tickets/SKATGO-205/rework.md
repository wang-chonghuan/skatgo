# SKATGO-205 rework

交付（handoff 830c11f）之后，人提了五轮修改，每轮一个提交。都只动联赛页上“联赛怎么玩”的说明；计分、牌桌、服务端没有改动。

1. 「这个文案改成一个折叠卡片，默认折叠，标题是，什么是League以及它为什么好玩。内容就写league是做啥的，以及它如何工作就行。当然，你决定措辞。但是必须精简，要考虑到大部分玩家没耐心。可以用bullets」（38bc699）
   — 原来联赛卡右上角的问号和 “How the League works” 弹窗（三段长文）去掉，改为一张默认折叠的卡片 “What is the League, and why is it fun?”，四条短要点（档位、每副计分、升降、金币）。复查：AC5（折叠、点开四条、按钮上的每副费用）PC 与手机，AC1、AC3。

2. 「放到第一个卡片的底部，用蓝色链接字就行，不用单独做大卡片」，接着「对，你来决定最好的ui」（22f5fa1）
   — 改成第一张卡片底部的一行链接字（带下划线和小箭头），点开后要点出现在卡片里。深蓝卡片上用白色（网站的链接蓝在深蓝底上对比度约 2.5:1），访客的白卡片上用蓝色。复查同上。

3. 「for each deal, you win in any cases +3, you lose as declearer -3, you lose as a defender -1, other cases +0 这么写是不是更清晰？但是语法要稍微休整」（eea025a）
   — 计分那条改为 “Each deal: win +3, in any role; lose as declarer −3; lose as a defender −1; otherwise 0.”（德文同义）。复查：AC5 PC。

4. 「这个折叠字放到页面标题的下面得了，别放那个卡片里了」（f7fcef5）
   — 链接移到页面标题 “League” 正下方的灰色页面上，访客和已登录玩家都一样，用网站的链接蓝；第 2 轮的白色变体去掉。复查：AC1、AC3、AC5 PC 与手机。

5. 「要写明，tier越高，对手越强。」（8df1c19）
   — 档位那条改为 “Six tiers, Bronze to Legend: the higher the tier, the stronger your opponents. Climb as high as your Skat takes you.”（德文同义）。不提 AI，联赛页那一行 AI 说明不变。复查：AC3、AC5 PC 与手机。

相对冻结的 handoff 的净变化：handoff 里的 “How the League works” 弹窗和它的三段说明（`league_how*`）不再存在，换成页面标题下一行默认收起的蓝色链接 “What is the League, and why is it fun?” 和四条要点（`league_about*`）。charter ui.md 的联赛页描述同步更新。handoff 的 Check 第 3 条（问号弹窗）因此作废。
