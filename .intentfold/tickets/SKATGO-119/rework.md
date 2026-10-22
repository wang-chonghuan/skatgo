# SKATGO-119 Rework

Three rounds after the first delivery (`handoff.md`), each asked by the human in review and committed once.

## Round 1 — the two small issues found on the way (`efb725d`)

Ask: 「你发现的2个小问题，本工单改了」 (the two older issues the handoff listed under Residual).

- The board's empty line says no **player** is on it yet ("Heute steht noch kein Spieler auf der Rangliste" /
  "No player on today's board yet", and the same for yesterday and earlier days), so it no longer contradicts
  the AI's row, which stays (SKATGO-80).
- The daily table's header: on a phone, "Punkte/Points" goes under its tag instead of running into the next
  column (`headWho` wraps).

Rechecked: phone 375×812 in German and English (wording; no overlapping header text, nothing past its column),
unit tests, `check:seo -- --built`. Ticket amended (criterion 6).

## Round 2 — the hidden exercise kinds back (`4a5023f`)

Ask: 「本工单做，恢复以前删掉的那些专题练习题」.

- `SHOWN_TYPES` is every kind again: under the open-card endgames, the "Sieg sichern" ladder and the twelve
  kinds of SKATGO-103 (86 exercises in all); each exercise's page opens and is judged; the article's practice
  links open their kinds again. They need no account and record nothing (the record stays the open-card
  endgames').
- The Tricks page's lead, meta title (its count from the data) and description name the kinds again.

Rechecked: 13 kinds, 86 exercise pages all 200, an answer judged, an article link opening its card; unit tests
(the shown-kinds test updated to the new requirement), `check:seo -- --built`. Ticket amended (criterion 7).

## Round 3 — the open-card endgames as the first collapsible kind (`d87916d`)

Ask: 「Endgames with open cards 这个 要可折叠，像其他题一样，它作为第一类练习题，本工单」.

- The open-card endgames are a `<details>` card like every kind: numbered 1, title, blurb and count solved in
  the head, the levels and "Aufgabe n spielen" inside; closed at first; a kind named in the address (the front
  page's "Skat-Aufgaben lösen" names this one) opens by itself and stops under the sticky header.

Rechecked: desktop and phone — closed at first, opens to 20 levels, opened from the front page's button with its
top under the header; the kinds and article links again; unit tests, `check:seo -- --built`. Ticket amended
(criterion 8).

## Round 4 — the production database open to the internet (this commit)

Ask: 「render这个数据库允许外网访问，密码对即可，不要搞白名单了。并且charter也修改。马上改了，然后重新关闭工单」 —
after a read-only count of production's daily rows took minutes of opening and closing the allow list.

- `skatgo-multiplayer-db`'s allow list set to `0.0.0.0/0` (Render API), password only.
- operations.md: the production database is open to the internet and protected by its password; the allow list
  is not closed or narrowed.

Rechecked: the allow list reads `0.0.0.0/0`; a production query runs without touching it.

## Net effect against the handoff

Besides the taller boxes, the six-deal tournament and the forum list text: the board's empty line and the phone
header fixed, every exercise kind shown again, the open-card endgames the first collapsible kind, and the
production database open to the internet with its password. Deploy order
stays web first, then multiplayer.
