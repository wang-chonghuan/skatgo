import { describe, expect, it } from 'vitest'

import { fullDeck, shuffle } from './cards'
import { type Seat, actor, adviceFor, aiBid, aiDeclare, bidAction, collectTrick, deal, playCard } from './game'
import { cardLabel } from './i18n'
import { visibleTable } from './table-view'

// The assistant's view of the table must never name a card the learner cannot see: nothing from the
// other two hands, and not the Skat unless the learner picked it up. Checked at every stage of
// hundreds of random games, all three seats played by the computers.

function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

describe('the table as the learner sees it', () => {
  it('names every card of the learner and no hidden card, at every stage of 300 games', () => {
    let stages = 0
    for (let seed = 1; seed <= 300; seed++) {
      let g = deal((seed % 3) as Seat, shuffle(fullDeck(), seeded(seed)))
      const check = () => {
        const text = visibleTable(g, [0, 0, 0])
        for (const c of g.hands[0]) expect(text, `seed ${seed} ${g.phase}: own ${cardLabel(c)}`).toContain(cardLabel(c))
        for (const seat of [1, 2] as Seat[]) for (const c of g.hands[seat]) expect(text, `seed ${seed} ${g.phase}: opponent ${cardLabel(c)}`).not.toContain(cardLabel(c))
        const skatVisible = g.declarer === 0 && g.pickedUp
        if (!skatVisible) for (const c of g.skat) expect(text, `seed ${seed} ${g.phase}: skat ${cardLabel(c)}`).not.toContain(cardLabel(c))
        expect(text.length).toBeLessThan(4000)
        stages++
      }
      check()
      while (g.phase === 'bidding') {
        g = bidAction(g, aiBid(g))
        check()
      }
      if (g.phase === 'passedIn') continue
      g = aiDeclare(g)
      check()
      let guard = 0
      while (g.phase !== 'done' && guard++ < 100) {
        if (g.phase === 'trickEnd') g = collectTrick(g)
        else g = playCard(g, adviceFor(g, actor(g)!)!.card)
        check()
      }
      check()
    }
    expect(stages).toBeGreaterThan(5000)
  })
})
