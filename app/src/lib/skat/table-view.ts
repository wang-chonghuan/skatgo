// The table as the learner sees it, in words (SKATGO-9): what the assistant is told when a question
// is asked during a game. It is built from the learner's seat and nothing else — the other hands and
// an unseen Skat are simply never read — so the assistant cannot leak what the learner may not know.
// table-view.test.ts holds it to that over hundreds of random games.
//
// The course's own hint is quoted as the authoritative move: the rules engine decides what to play,
// the assistant explains and answers follow-ups.

import { type Card, pointsOf, sortHand } from './cards'
import { type Game, type Seat, actor, forehandOf, legalFor, roleOf, runningPoints } from './game'
import { currentHint } from './hints'
import { cardLabel, contractName, roleName } from './i18n'
import { m } from '~/paraglide/messages'

const ME: Seat = 0

const seatName = (s: Seat) => (s === 0 ? m.name_you() : s === 1 ? m.name_lina() : m.name_max())
const labels = (cs: Card[]) => (cs.length ? cs.map(cardLabel).join(' ') : '—')

/** Plain lines about the game from seat 0's point of view, for the assistant's context. */
export function visibleTable(game: Game, scores: [number, number, number]): string {
  const lines: string[] = []
  const contract = game.declaration?.contract ?? null
  lines.push(`Seats: ${seatName(0)} (${roleName(roleOf(0, game.dealer))}), ${seatName(1)} (${roleName(roleOf(1, game.dealer))}), ${seatName(2)} (${roleName(roleOf(2, game.dealer))}). Forehand: ${seatName(forehandOf(game.dealer))}.`)
  lines.push(`Phase: ${game.phase}.`)
  lines.push(`Your hand: ${labels(sortHand(game.hands[ME], contract))}`)

  if (game.bidding.log.length > 0) {
    lines.push(`Bidding: ${game.bidding.log.map((e) => `${seatName(e.seat)} ${e.say === 'pass' ? 'passes' : e.say === 'hold' ? `holds ${e.value}` : `bids ${e.value}`}`).join('; ')}.`)
  }
  if (game.phase === 'passedIn') lines.push('Everyone passed: the deal is void.')

  if (game.declarer !== null) {
    const d = game.declaration
    const decl = d
      ? `${contractName(d.contract)}${d.hand ? ' Hand' : ''}${d.ouvert ? ' Ouvert' : ''}${d.schneiderAnnounced ? ', Schneider announced' : ''}${d.schwarzAnnounced ? ', Schwarz announced' : ''}`
      : 'not declared yet'
    lines.push(`Declarer: ${seatName(game.declarer)}, bid ${game.bid}. Contract: ${decl}.`)
  }

  // The Skat: the learner knows it only after picking it up as declarer.
  if (game.declarer === ME && game.pickedUp) {
    if (game.phase === 'skat') lines.push(`You picked up the Skat; you now hold 12 cards and must put 2 away.`)
    else lines.push(`You picked up the Skat and put away: ${labels(game.skat)} (they count for you).`)
  } else if (game.declarer === ME && game.declaration && !game.pickedUp) {
    lines.push('You play Hand: the Skat stays unseen.')
  } else if (game.declarer !== null && game.declarer !== ME) {
    lines.push('The Skat is unseen (it belongs to the declarer).')
  } else {
    lines.push('The Skat lies face down, unseen.')
  }

  if (game.tricks.length > 0) {
    lines.push('Tricks so far:')
    game.tricks.forEach((t, i) => {
      lines.push(`  ${i + 1}. ${t.cards.map((p) => `${seatName(p.seat)} ${cardLabel(p.card)}`).join(', ')} → ${seatName(t.winner)} (${pointsOf(t.cards.map((p) => p.card))} points)`)
    })
  }
  if (game.trick.length > 0) {
    lines.push(`Current trick: ${game.trick.map((p) => `${seatName(p.seat)} ${cardLabel(p.card)}`).join(', ')}.`)
  }
  const who = actor(game)
  if (game.phase === 'play' || game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'declare') {
    lines.push(who === ME ? 'It is your move.' : who === null ? 'Waiting.' : `Waiting for ${seatName(who)}.`)
  }
  if (game.phase === 'play' && who === ME) lines.push(`Cards you may play now: ${labels(legalFor(game, ME))}`)

  if (game.declarer !== null && (game.phase === 'play' || game.phase === 'trickEnd' || game.phase === 'done')) {
    const p = runningPoints(game)
    lines.push(`Card points taken so far: declarer ${p.declarer}, defenders ${p.defenders}.`)
  }
  lines.push(`Table scores: ${seatName(0)} ${scores[0]}, ${seatName(1)} ${scores[1]}, ${seatName(2)} ${scores[2]}.`)

  if (game.phase === 'done' && game.result && game.declarer !== null) {
    const r = game.result
    lines.push(`Result: ${seatName(game.declarer)} ${r.won ? 'won' : 'lost'} (declarer ${r.declarerPoints} card points, defenders ${r.defenderPoints}); game value ${r.value}, scored ${r.score}.`)
  }

  const hint = currentHint(game)
  if (hint) lines.push(`Course hint for this move (authoritative, from the rules engine): ${hint.text.replace(/\*\*/g, '')}`)

  return lines.join('\n')
}
