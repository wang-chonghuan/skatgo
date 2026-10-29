# SKATGO-152 grill

没有问题过线（代价高 + 无记录可定 + 不能展示），全部按下列依据自定。

## Decided for you

1. **distinct id 用什么？** Clerk 账号 id（`user_…`），person 属性 `player` = `user:<id>` 对上数据库。依据：工单 Scope 原话。
2. **person 属性带 email / 真名吗？** 不带：账号 id、创建时间、榜单昵称。依据：隐私政策现有一句"Google 登录资料不会发给分析"，人要求隐私只小改；昵称已足够在 PostHog 里找人（之前"用户 mark"的查法就是按昵称）。可逆。
3. **代理路径名？** `/hx`。依据：工单要求中性、不叫 ingest/posthog；短且不像统计词。
4. **新注册怎么判？** identify 时从匿名变已识别、且账号建于 1 小时内，发一次 `account_signed_up`。依据：工单 Scope；同 SKATGO-117 的一小时窗口。
5. **登录点击区分位置？** 属性 `at`（header、home、daily、profile、tricks、bidding、forum_post、forum_comment、table_open、table_sign_up），页面已由 `track()` 自动带 `page`。依据：工单"哪个页面、哪个位置"。
6. **daily 名字怎么拿？** 完成那步后读一次榜单 `me.nickname`，不改 multiplayer。依据：名字在完成时由服务端写入（SKATGO-90），榜单已返回它；不加服务端改动更简单。
7. **AI 同座分从哪来？** 自由对局/第 11 课结算时用已缓存的复盘 `ai.scores[0]`，拿不到为 null。依据：结果卡本就请求同一复盘，不多请求。
8. **练习事件覆盖哪些？** 牌技练习（每类 section = 类型）和叫牌练习（section = `bidding`），首答一次，含"再来一次"的新尝试。依据：工单"练习题完成（哪一部分、第几题、对错）"。
9. **线上 AC 怎么验？** 本工单 finish = review：本地核对事件与代理；1–5 的线上部分在合并部署后按 ac.md 核对。依据：部署属于 cap4。
