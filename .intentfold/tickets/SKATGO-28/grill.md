# SKATGO-28 grill

Mode: human. Inputs: the live ticket, `plan.md`, `ac.md`, and the code and charter lines above.

## Batch 1

### Q1. What happens to the old Chinese addresses (`/zh/...`)?

**Recommended: a permanent redirect (301) to the same page in English**, e.g. `/zh/course` →
`/en/course`. Search engines have indexed them and people may have shared them; a redirect keeps both
working and tells search engines to drop the Chinese pages. The alternative is "page not found".

**Decision:** pending

### Q2. The shortened hero text

Today (en): "Your computer opponents never leave the table — no third player to find, no waiting. Sit
down and play; soon you'll play the same deals as everyone else and compare scores."

**Recommended, one sentence:**
- **en:** "Computer opponents are always at the table — sit down and play Skat whenever you like."
- **de:** "Deine Computergegner sitzen immer am Tisch – setz dich hin und spiel Skat, wann du willst."

The promise about the same deals for everyone goes, because the "Duplicate · coming soon" tile below
already says it.

**Human's answer (2026-09-30):** 「slogan不对，应该改为复式，因为这是我主打的功能，就是每天没人打12幅牌，看排名。突出我的主打功能」
The slogan must feature Duplicate: every day, everyone plays the same 12 deals, and sees the ranking.

**Second answer (2026-09-30):** 「你去查查 funbridge等其他这种形式的app是如何宣传这一点的，学学。另外不要把12等数字写到文案里」
(Look at how Funbridge and similar apps promote this, and learn from them; no numbers such as 12 in
the copy.)

**What the others say.** Read 2026-09-30, summarised in the agent's words; no copy is taken.

- **Funbridge** (bridge, the same format as Duplicate). Its duplicate pitch rests on:
  - **fairness**: everyone gets the same deals under the same conditions, so only your own decisions
    make the difference;
  - **comparison**: you see your rank against players everywhere right after each deal;
  - **learning**: you see where your result differs and improve;
  - **rhythm**: a daily tournament to "compare yourself with thousands", and weekly leagues to climb.

  Big numbers appear only as social proof in a separate strip, never in the headline.
- **BBO** (bridge): every mode names its leaderboard, and a mode is described by its shape (a stream of
  hands, a short set of deals), not by a promise.
- **Skat Palast** (the largest German Skat site): real opponents, community, tournaments and rankings.
  It does **not** lead with the same cards for everyone. That fair comparison is where SkatGo can stand
  apart among Skat sites.
- **The daily-puzzle pattern** (Wordle and the like): one fresh set each day, the same for everyone;
  come back tomorrow and compare.

**What this suggests for SkatGo.** Lead with fairness: what Skat players grumble about is the luck of
the deal (Kartenglück), and Duplicate removes it. Then the daily rhythm and the ranking. No numbers.

**Options (original wording):**
- **A (recommended): the luck of the deal gone.**
  - en: headline "Skat without the luck of the deal."; lead "Every day everyone plays the same deals, so
    the ranking shows who played them best."
  - de: headline "Skat ohne Kartenglück."; lead "Jeden Tag spielen alle dieselben Blätter – die Wertung
    zeigt, wer sie am besten gespielt hat."
- **B: same cards, your play decides.**
  - en: "Same cards for everyone. Your play decides." / "Play today's deals and see where you rank
    among everyone who played them."
  - de: "Gleiche Karten für alle. Dein Spiel entscheidet." / "Spiel die Blätter des Tages und sieh, wo
    du unter allen stehst."
- **C: the daily ritual.**
  - en: "Today's deals. Everyone's ranking." / "New deals every day, the same for all players – play
    them and see your place."
  - de: "Die Blätter des Tages. Die Wertung aller." / "Jeden Tag neue Blätter, für alle dieselben –
    spiel sie und sieh deinen Platz."

**Third answer (2026-09-30):** 「主要句子不要突出复式，主句还是现代竖屏Skat，学习和比赛」
The headline is not about Duplicate. It says modern Skat made for a phone held upright, to learn and to
compete. Duplicate may appear as the competition in the lead; there are still no numbers.

**Proposal (awaiting confirmation):**
- **A (recommended):**
  - en: headline "Modern Skat, made for your phone. Learn it, then compete."; lead "Learn step by step
    against the computer – and soon play the same deals as everyone else and compare."
  - de: headline "Modernes Skat, gemacht fürs Handy. Lernen, dann messen."; lead "Lern Schritt für
    Schritt gegen den Computer – und spiel bald dieselben Blätter wie alle anderen und vergleich dich."
- **B:**
  - en: "Skat for your phone: learn it, play it, compete." / "A short course, a table that's always
    open, and soon the same deals for everyone."
  - de: "Skat fürs Handy: lernen, spielen, messen." / "Ein kurzer Kurs, ein Tisch, der immer offen ist,
    und bald dieselben Blätter für alle."

"Soon" keeps the lead honest while Duplicate is not live; it goes when Duplicate launches.

**Follow-up questions (Duplicate is not live yet; its tile says "coming soon"; the hero's action opens
free play):**
- **Q2a:** mark it "coming soon" in the hero until it launches? Recommended: change only the text of
  the green eyebrow pill to "Duplicate · coming soon", with no new element.
- **Q2b:** keep the hero action on free play until Duplicate launches? Recommended: yes.

**Decision:** pending

### Q3. Where and how does "fully in English and German" appear?

**Recommended: in the navy facts strip under the hero**, replacing the item that today reads
"English · German · Chinese", in exactly that item's style:
- **en:** "Fully in English and German"
- **de:** "Komplett auf Deutsch und Englisch"

No new badge, colour or element.

**Decision:** pending

### Q4. A visitor who chose Chinese before

**Recommended: treat the saved choice as none.** They get German if their browser asks for it, and
English otherwise. The next choice they make in the menu is saved as usual.

**Decision:** pending

### Q5. The charter still says three languages

`product.md` (it describes "Chinese, English and German" and "three languages and no others") is
yours, and its own redline forbids the agent to edit it. `operations.md` mentions `/zh` once, in prose;
its check derives the languages itself and needs no change.

**Recommended:** I write the exact replacement lines into the handoff; you apply them, or tell me in
so many words to edit those lines.

**Decision:** pending
