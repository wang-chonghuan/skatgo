# SKATGO-23 grill

Mode: human. Inputs: the live ticket, `plan.md`, `ac.md`, the charter, and the code listed in
`plan.md`.

## Batch 1

### Q1. Where does the course map go?

**Recommended: `/course`**, with the entry page at `/`. It is still server-rendered, so search engines
keep reading the lessons. The course map itself is unchanged: its "continue" and "free play" buttons
stay.

**Why:** the entry page has to own `/`. `/course` matches the card's name in all three languages
better than `/learn` or `/lessons`.

**Decision:** accepted as recommended — human, 2026-09-27 (「全部同意」)

### Q2. Where do the "back" links go now?

**Recommended:**
- **Inside the course → `/course`**: a lesson's ✕, the finish screen's "回到目录", and the redirect
  for an unknown lesson all lead there.
- **Free play's back link → the entry page `/`**, relabelled "← 首页 / ← Home / ← Start". Play is now
  its own section, so sending it to the course map would be odd.
- **Header brand**: still `/`.

This changes the ticket's last acceptance criterion: "从课程返回目录 → 课程目录；从牌桌返回 → 首页".

**Decision:** accepted as recommended — human, 2026-09-27 (「全部同意」)

### Q3. The assistant on the entry page (this is a model prompt, so it's your decision)

- **Current state**: `/` tells the model "the course map, listing all lessons".
- **Recommended**: a new page kind, `entry`. It describes the site's four sections, says Duplicate and
  Puzzles are not open yet, and says the model must not invent their rules or dates.
- **Other pages**: `/course` keeps the existing course-map description.
- **Alternative**: no assistant on the entry page.

**Decision:** accepted as recommended — human, 2026-09-27 (「全部同意」)

### Q4. New tokens for the card art (ui.md Redline 1)

The art needs values the registries don't have. I propose adding exactly these:
- `size.entryArt`: the height of each card's felt art band, about 120px.
- `move.tiltLeft` / `move.tiltRight`: the tilt of the outer cards in a small fan, about ∓8°.
- `size.entryFanOverlap`: how far fanned cards overlap, about −18px.

Final values are set by eye during the build and reported in the handoff. Everything else (felt,
cards, pill, grid, radius, spacing, typography roles) reuses existing tokens and components.

**Recommended: approve these four.**

**Decision:** accepted as recommended — human, 2026-09-27 (「全部同意」)

### Q5. What the cards show

**Recommended:**
- **Course card**: shows the learner's progress, "已完成 3 / 11 课", after the page mounts, the way
  the course map does. Its button reads "开始学" before any lesson is done and "继续" after.
- **Play card**: a fixed button, "开一桌".
- **Duplicate and Puzzles cards**: a "即将推出" pill, dimmed art, and no hover or focus. They are not
  links or buttons, so the keyboard skips them.

Copy and art are in `plan.md`. You delegated these to me; say so if anything grates.

**Decision:** accepted as recommended — human, 2026-09-27 (「全部同意」)

## Outcome

All five accepted as recommended. The ticket's fourth acceptance criterion now reads that the course's
back links return to the course map and free play's back link returns to the entry page (Q2).
Redline 1 approval: the four entry-art tokens in Q4. The model context gains an `entry` page (Q3).
