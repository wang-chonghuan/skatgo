# SKATGO-231 rework

Nine rounds after the first delivery (handoff `381fc92`), each the human's ask, one commit each. The live ticket's
Scope, Constraints and Acceptance criteria were amended with them; `handoff.md` stays as first delivered.

| Round | The human's ask | What changed | Rechecked |
|---|---|---|---|
| 1 `817786c` | 「我不满意，我觉得太乱。我希望极简形式的。每个主题，都是一系列列表，然后可以检索和排序（时间， 互动量）。公告列表，讨论列表，高级课程列表。就这三个就行了。列表不要做成卡片……点回复时自动at即可」 | Three lists (news, talk, guides) under tabs; search over title and text (the reader's translation too) and sort newest / most commented, server-side and without script; posts as lines; videos, featured block and side navigation gone; Reply writes "@Name" into the comment box. product.md now allows search. | All 10 AC rewritten and run headed; mechanical defence |
| 2 `24104c3` | 「颜色要丰富一下，还要用skatgo的设计系统……不够彩色和鲜艳」 | Back on the lobby design: Red Hat Display, navy, green `go`; each list marked in its front-page tile's colour; coloured avatars; one white panel of lines. Geist tokens, font and roles removed; the kit's TextField gains name/search/placeholder, TextArea a ref. | AC1 rewritten; all AC; mechanical defence |
| 3 `714b7dc` | 「我发的帖子，都用skatgo的logo，不好看，太重复了，这类论坛一看就是只有老板在发帖的，咋办」 → 「按建议改」 | No logo; up to three commenters' avatars on each line; the discussion is the players' own and SkatGo's five articles become announcements (migration `articles` → `news`). | All AC (search/sort/AC9 moved to announcements); mechanical defence |
| 4 `408310f` | 「https://github.com/multiavatar/Multiavatar 能否……每个帖子都根据标题自动生成一个这样的图片」 → 「同意。」 | Each post's picture from its title, players' from their names, drawn by the web at `/api/forum/avatar/`; `@multiavatar/multiavatar` 1.0.7 (approved). | AC1 (+ pictures distinct, same twice); mechanical defence |
| 5 `7b14773` | 「课程前面不要加1，2，3那个橙色的编号」 | Lesson titles without numbers in the list and on the page. | AC6 headed, desktop and phone |
| 6 `2938050` | 「等下。https://github.com/dicebear/dicebear……头像太年轻化……稍微沉稳一点……老的集成暂时不用删」 → 「我觉得E比较好」 | DiceBear Avataaars (`@dicebear/core` 9.4.3, `@dicebear/avataaars` 9.4.2, approved), first tuned to grown-ups' looks; Multiavatar kept at `/api/forum/multiavatar/`, shown nowhere. | Build, unit tests, bundle, tokens; avatar route |
| 7 `a70832c` | 「有缓存，我看不出来」 | The style version in the avatar address (`AVATAR_STYLE`), so a new style is fetched anew. | Build, unit tests, bundle, tokens; page uses the versioned addresses |
| 8 `cf795ae` | 「风格改的太沉稳了，你就用E的标准默认风格吧」 | Avataaars' standard looks on the soft round grounds; `a2`. | Build, unit tests, bundle, tokens |
| 9 `d73fff6` | 「能否设置不要黑人，我们用户里没黑人」 | Skin tones without Avataaars' two darkest; `a3`. | Build, unit tests, bundle, tokens; 212 sampled avatars, none with those tones |

## Net effect against the handoff

The forum is three plain lists — Announcements (the forum's own page), Discussion, Advanced course — in the lobby
design: a row of tabs each marked in its tile colour, a search field and Newest / Most active, the posts as lines in one
white panel, each with its picture from its title, its commenters' pictures and count. A post's page: breadcrumb, the
post in a white card, comments in one card, Reply writing "@Name", small round report/delete/hide buttons. Avatars are
DiceBear Avataaars drawn on the server at `/api/forum/avatar/a3/<text>.svg`. The Geist design of the first delivery,
the videos section and the home's featured block are gone. SkatGo's five articles land among the announcements, not
the discussion.

Dependencies added in total: `@dicebear/core` 9.4.3, `@dicebear/avataaars` 9.4.2, and `@multiavatar/multiavatar` 1.0.7
(kept for now at the human's word, unused by the pages).
