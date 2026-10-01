# SKATGO-36 rework

Changes after the first delivery (`handoff.md`, frozen at 8309db9). All four rounds are the
human's asks about the front page, done here as rework at their request (strictly they are outside
the leaderboard's scope).

## Round 1 — 52efc26

**Ask:** remove the green "Play" button in the top bar; the top links should be today's deals, guided
free play, course, rules.

**Changed:** `LandingHeader` (`frame.tsx`) lost the `header-play` button. Its links, and the phone
menu, come from one ordered list. New strings `nav_header_daily` and `nav_header_practice` (renamed in
round 2).

## Round 2 — fe713aa

**Ask:** 「你这么写不对，你这么写好像是练习一样，每日挑战题，练习题」 — "Daily Challenge" and
"Practice" read like exercises.

**Changed:** the labels are now Daily Tournament / Free Play / Course / Rules, and in German
Tagesturnier / Freies Spiel / Kurs / Regeln — the names the site already uses (`free_title`, the
German tournament title). The key is now `nav_header_free`.

## Round 3 — 02c83ca

**Ask:** the hero's "Never played Skat? Start here" button: rename it to Course, or is it needed at
all next to the top bar? The human chose **remove**.

**Changed:** the hero has one action, "Play today's deals". The way into the course is the header
(the menu on a phone) and the course tile. `entry_cta_learn` and the `secondary` hero click event
are gone.

## Round 4 — eaea24e

**Ask:** the navy strip "12 deals a day, ranked / Free to play / Unlimited AI games" is too loud and
says little; redesign it. The human chose **one quiet line under the button**.

**Changed:** the strip is gone. Under the button there is one grey line with green ticks: Free · No
sign-up · New deals at midnight (Kostenlos · Ohne Anmeldung · Neue Karten um Mitternacht). The old
`entry_point_daily` and `entry_point_ai` strings were removed.

## Rechecked

Only what each round touched, headed, at 1280×820 and 375×812, in `en` and `de`:
- the header links' order, labels and targets, with no Play button;
- the phone menu;
- the hero's single action, with the course tile still linking to the course;
- the facts line sitting right under the button, with no coloured block and no sideways scroll.

App tests passed after the string changes. The mechanical defence passed once on the final branch.

## Net effect against the handoff

The leaderboard, the nickname form and everything in `handoff.md` are unchanged. The front page's
header and hero are different, as above. The left rail and the phone tab bar keep their old
labels (Daily, Play), which the human has not ruled on yet.
