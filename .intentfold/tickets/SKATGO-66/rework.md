# SKATGO-66 rework

Changes after the first delivery (`handoff.md`, commit `65900e3`), one commit per request.

1. **"字母为啥换成J了，默认的套应该是德国正规skat比赛的套，可选的套是另一个，就这样。J的那个字母如果不正规，就作为第三个套，还是恢复那个选牌的地方"** (`852da9b`)
   - The corner letters no longer follow the page language. The default deck is the tournament deck's B / D / K / A everywhere.
   - The settings gear is back, in the header and as the table's settings tab, as the choice of deck: the default, and the same deck with J / Q / K / A.
   - The store is `lib/skat/settings.ts`, key `skatgo.settings.v2`, `deck`. A stored choice applies after mount, so the server's markup hydrates.
   - This overturned grill Q6. The ticket's scope and AC 4 were updated, with a comment.
   - Rechecked (`tmp/rw1.mjs`), desktop and phone:
     - default letters on `/de/`, `/en/` and `/en/play`;
     - the dialog's options;
     - J / Q / K after choosing in the header and after a reload;
     - switching back at the table's tab (desktop; on the phone that tab sits in the closed drawer, restored unchanged).
2. **"德国那套呢，也必须显示出来"** (`1a5dac9`)
   - The Deutsches Blatt is a third choice. Chosen, every card is drawn in it: the German courts and Daus pictures, the German symbols as pips, and K / O / U / A. It follows the overview the human confirmed, and the choice is remembered.
   - This brings SKATGO-67's main content into this ticket; SKATGO-67 was narrowed to what remains.
   - Rechecked (`tmp/rw2.mjs`), desktop and phone: the dialog's three options; front page, lesson 2 and the table after a reload all drawn in the German deck; every picture loads.
3. **"我要标准名字，就是德国玩家看了不会挑刺的名字，具体是啥名字，我不懂"** (`389f336`)
   - The decks carry their standard names:
     - "Turnierblatt (französisches Blatt, vier Farben)": the DSkV's tournament deck since 1994;
     - "Deutsches Blatt (Eichel, Grün, Herz, Schellen)";
     - "Turnierblatt mit englischen Buchstaben", since J / Q / K / A has no standard name of its own.
   - The English labels are tournament deck, German-suited deck, and tournament deck with English letters.
   - Rechecked (`tmp/rw3.mjs`): the names in both languages at both sizes, fitting the screen.

**Effect on the AC:**
- AC 3 now reads "the French deck by default; the settings offer decks only, no colour scheme". It held after each round.
- AC 4 is the human's new wording, met as in round 1.

**Net effect against the handoff:**
- The settings come back as a choice of three decks (the Turnierblatt by default).
- The letters belong to the deck, not the language.
- The German deck's pictures are in use.
- `ui.md` was updated to match.
