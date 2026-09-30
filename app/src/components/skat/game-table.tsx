import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { type Card, type Contract, SUITS, cardId, effectiveSuit, sameCard, sortHand } from '~/lib/skat/cards'
import { bidHint, declareHint, discardHint, playHint, skatHint } from '~/lib/skat/hints'
import { useTableSnapshot } from '~/lib/skat/table-snapshot'
import { visibleTable } from '~/lib/skat/table-view'
import { cardLabel, contractName, ledName, partLabel, roleName, settleReason } from '~/lib/skat/i18n'
import {
  type Game,
  type Seat,
  actor,
  adviceFor,
  aiBid,
  aiDeclare,
  bidAction,
  collectTrick,
  deal,
  declare,
  discard,
  legalFor,
  next,
  pickUpSkat,
  playCard,
  playHand,
  normalise,
  roleOf,
  runningPoints,
  trickWinner,
} from '~/lib/skat/game'
import { type Declaration, expectedValue, nextBid } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, GraduationCap, Lightbulb, Settings, Spade, X } from 'lucide-react'

import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { confettiBurst, drawer, icon, trick } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, fill, pose } from '../../theme/elevation.stylex'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Fan } from './card-row'
import { SettingsDialog } from './frame'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Pill, Rich, linkLook } from './ui'

// A whole game of Skat against two computer players. All rules live in ~/lib/skat/game; this file
// renders a state and dispatches the learner's moves, and lets the computers move on a timer so the
// learner can follow what happened.
//
// SKATGO-26, the lobby design's card table (reference.md), laid out for Skat's three players:
//   the felt     — a radial green under a fine grain; both opponents' hands in the learner's card size,
//                  sideways and running off the left and right edges; a gold frame in the centre holding
//                  the skat, the trick, or the action box (Reizen, the skat, the contract picker), with
//                  the seat plates on its edges; the hint tab on the left edge; the learner's hand in a
//                  row along the bottom;
//   the panel    — 450 wide on grey: the game tab, the Reizen history in dark columns, the contract
//                  and the count, notes and hints, and the red leave button. On a phone it is a drawer
//                  parked off the right edge behind a white tab;
//   the dialogs  — the settlement and a passed-in deal, white on a scrim.
// Inside a lesson the same table is embedded: the panel stacks under the felt and there is no leave.

const ME: Seat = 0
/** A seat's name in the current language — read at render, so it is always the page's language. */
const nameOf = (seat: Seat) => [m.name_you, m.name_lina, m.name_max][seat]()

const BOT_DELAY = 850
const TRICK_DELAY = 1300

type Props = {
  /** Called once per game, when it is settled. */
  onSettled?: (info: { humanWon: boolean; humanScore: number }) => void
  /** Free play: the table fills the screen and offers a way out. A lesson embeds it instead. */
  fullScreen?: boolean
}

export function GameTable({ onSettled, fullScreen = false }: Props) {
  const [dealer, setDealer] = useState<Seat>(2)
  const [game, setGame] = useState<Game>(() => deal(2))
  const [scores, setScores] = useState<[number, number, number]>([0, 0, 0])
  const [picked, setPicked] = useState<Card[]>([])
  const [hint, setHint] = useState<{ card?: Card; cards?: Card[]; text: string } | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [draft, setDraft] = useState<Declaration | null>(null)
  const settledFor = useRef<Game | null>(null)

  const who = actor(game)
  const contract = game.declaration?.contract ?? null
  const myTurn = who === ME

  // The computers move on a timer. The updater re-checks the state it is handed, so a timer that
  // fires late (or twice, under StrictMode) cannot move for the wrong player.
  useEffect(() => {
    if (game.phase === 'trickEnd') {
      const t = setTimeout(() => setGame((g) => collectTrick(g)), TRICK_DELAY)
      return () => clearTimeout(t)
    }
    if (who === null || who === ME) return
    const t = setTimeout(() => {
      setGame((g) => {
        const a = actor(g)
        if (a === null || a === ME) return g
        if (g.phase === 'bidding') return bidAction(g, aiBid(g))
        if (g.phase === 'skat' || g.phase === 'declare') return aiDeclare(g)
        if (g.phase === 'play') {
          const advice = adviceFor(g, a)
          return advice ? playCard(g, advice.card) : g
        }
        return g
      })
    }, BOT_DELAY)
    return () => clearTimeout(t)
  }, [game, who])

  useEffect(() => {
    if (game.phase !== 'done' || !game.result || game.declarer === null || settledFor.current === game) return
    settledFor.current = game
    const { result, declarer } = game
    setScores((s) => {
      const out: [number, number, number] = [...s]
      out[declarer] += result.score
      return out
    })
    const humanWon = declarer === ME ? result.won : !result.won
    onSettled?.({ humanWon, humanScore: declarer === ME ? result.score : 0 })
    if (humanWon) {
      void confetti(confettiBurst.game)
    }
  }, [game, onSettled])

  // Anything said about the previous state is stale once the state moves on.
  useEffect(() => {
    setHint(null)
    setRefusal(null)
  }, [game])

  // The assistant (SKATGO-9) reads the table through this: the learner's own view, refreshed on every
  // change and withdrawn when the table leaves the page.
  const publish = useTableSnapshot((s) => s.publish)
  useEffect(() => {
    publish(visibleTable(game, scores))
  }, [game, scores, publish])
  useEffect(() => () => publish(null), [publish])

  function newGame() {
    const d = next(dealer)
    setDealer(d)
    setPicked([])
    setDraft(null)
    setGame(deal(d))
  }

  const myHand = useMemo(() => sortHand(game.hands[ME], contract ?? draft?.contract ?? null), [game.hands, contract, draft])
  const legal = game.phase === 'play' && myTurn ? legalFor(game, ME) : undefined
  const points = runningPoints(game)
  const winner = trickWinner(game)

  function onCard(card: Card) {
    if (game.phase === 'skat' && game.declarer === ME && game.pickedUp) {
      setPicked((p) => (p.some((c) => sameCard(c, card)) ? p.filter((c) => !sameCard(c, card)) : p.length < 2 ? [...p, card] : p))
      return
    }
    if (game.phase !== 'play' || !myTurn || !contract) return
    if (!legal?.some((c) => sameCard(c, card))) {
      setRefusal(m.play_refusal({ led: ledName(effectiveSuit(game.trick[0].card, contract)) }))
      return
    }
    setGame((g) => playCard(g, card))
  }

  function showPlayHint() {
    const h = playHint(game)
    if (h) setHint(h)
  }

  const lastBidBy = (seat: Seat) => {
    const events = game.bidding.log.filter((e) => e.seat === seat)
    const e = events[events.length - 1]
    if (!e) return null
    return e.say === 'pass' ? m.bid_pass() : e.say === 'hold' ? m.bid_hold_said({ value: e.value }) : m.bid_said({ value: e.value })
  }

  // The side panel is a drawer over the felt at any width (SKATGO-29): closed until the learner opens it.
  const [panelOpen, setPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const inFrameActions = game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'declare'
  const acting = inFrameActions && myTurn
  const dialog = game.phase === 'passedIn' || game.phase === 'done'

  return (
    <div data-testid="skat-table" data-phase={game.phase} data-layout={fullScreen ? 'full' : 'embedded'} {...stylex.props(styles.table, fullScreen ? styles.tableFull : styles.tableEmbedded)}>
      <div data-testid="skat-felt" {...stylex.props(styles.felt, fullScreen && styles.feltFull)}>
        {/* The top of the felt (SKATGO-32): the info board, and right under it the table's messages — a
            hint the learner asked for, or why a card was refused — each until it is closed. Nothing
            here can be covered by the hand or the drawer below. */}
        <div data-testid="skat-top" {...stylex.props(styles.top)}>
          <InfoBoard game={game} scores={scores} points={points} />
          {refusal || hint ? (
            <div data-testid="skat-messages" {...stylex.props(styles.messages)}>
              {refusal ? (
                <Message tone="bad" onClose={() => setRefusal(null)}>
                  <Rich text={refusal} />
                </Message>
              ) : null}
              {hint ? (
                <Message tone="tip" testId="skat-hint-text" onClose={() => setHint(null)}>
                  <Rich text={hint.text} />
                </Message>
              ) : null}
            </div>
          ) : null}
        </div>
        {/* Both opponents' hands: the same cards as the learner's, turned sideways and stacked down the
            left and right edges, running off the felt so only part of each shows (SKATGO-26). */}
        {([1, 2] as Seat[]).map((seat) => (
          <Stack key={seat} seat={seat} game={game} />
        ))}

        <div data-testid="skat-frame" {...stylex.props(styles.frame, styles.framePlay)}>
          {/* The pile is on the table until somebody picks it up; after that the two cards are in a hand. */}
          {(game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'passedIn') && game.skat.length > 0 ? (
            <div {...stylex.props(styles.skatPile)}>
              {/* The skat lies in the frame like a played card: the same size as the trick's cards. */}
              <div {...stylex.props(styles.skatCards)}>
                {game.skat.map((c, i) => (
                  <span key={i} {...stylex.props(styles.frameCard)}>
                    <PlayingCard card={c} faceDown size="fill" />
                  </span>
                ))}
              </div>
              <span {...stylex.props(typography.tricksLabel, styles.goldLabel)}>{m.table_skat()}</span>
            </div>
          ) : null}

          {(
            <>
              <AnimatePresence>
                {game.trick.map((p) => (
                  <motion.div
                    key={cardId(p.card)}
                    initial={{ opacity: 0, scale: trick.fromScale, ...trick.from[p.seat] }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: trick.exitScale, transition: { duration: trick.exitDuration } }}
                    transition={trick.spring}
                    {...stylex.props(styles.trickCard, positions[p.seat])}
                  >
                    <PlayingCard card={p.card} size="fill" glow={game.phase === 'trickEnd' && winner === p.seat} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}

          {/* What happens in the play — whose move, who is thinking, who took the trick — is said over the
              frame, never inside it: the frame holds only cards. Hints and refusals are messages at the
              top (SKATGO-32). */}
          {!acting && !dialog ? (
            <div data-testid="skat-words" {...stylex.props(styles.above)}>
              {game.phase === 'trickEnd' && winner !== null ? (
                <Pill tone="amber">{winner === ME ? m.table_trick_you() : m.table_trick_other({ name: nameOf(winner) })}</Pill>
              ) : (
                <div data-testid="skat-actions" {...stylex.props(styles.words)}>
                  <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} setGame={setGame} setPicked={setPicked} setHint={setHint} onNewGame={newGame} />
                </div>
              )}
            </div>
          ) : null}

          {/* The seat plates lie on the frame's edges: the opponents' along the left and right, the
              learner's orange one under the bottom edge. */}
          {([1, 2] as Seat[]).map((seat) => (
            <div key={seat} data-testid={`skat-seat-${seat}`} {...stylex.props(styles.plateSlot, seat === 1 ? styles.plateSlotLeft : styles.plateSlotRight)}>
              <Plate seat={seat} game={game} active={who === seat} />
            </div>
          ))}
          <div {...stylex.props(styles.plateSlot, styles.plateSlotBottom)}>
            <Plate seat={ME} game={game} mine active={myTurn} />
          </div>

          {/* What each opponent last said in Reizen, in the frame's corner on their side. */}
          {([1, 2] as Seat[]).map((seat) => {
            const said = game.phase === 'bidding' || game.phase === 'passedIn' ? lastBidBy(seat) : null
            return said ? (
              <span key={seat} data-testid={`skat-said-${seat}`} {...stylex.props(typography.bidChip, styles.chip, styles.saidChip, seat === 1 ? styles.saidLeft : styles.saidRight, said === m.bid_pass() ? styles.chipPass : styles.chipBid)}>
                {said}
              </span>
            ) : null
          })}
        </div>

        {/* The learner's move — Reizen, the skat, the discard, the contract — in a drawer that rises from
            the bottom of the table and stops above the hand, which the discard still needs. */}
        <AnimatePresence>
          {acting ? (
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="false"
              data-testid="skat-actions"
              initial={{ opacity: 0, y: drawer.rise }}
              animate={{ opacity: 1, y: 0 }}
              // It leaves at once: fading out, it would lie over the words that follow it.
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: drawer.duration }}
              {...stylex.props(styles.drawer)}
            >
              <span aria-hidden="true" {...stylex.props(styles.drawerHandle)} />
              <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} setGame={setGame} setPicked={setPicked} setHint={setHint} onNewGame={newGame} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* The hint: a tab on the felt's left edge, while it is the learner's card to play. */}
        {game.phase === 'play' && myTurn ? (
          <button type="button" data-testid="skat-hint" aria-label={m.play_hint_button()} title={m.play_hint_button()} onClick={showPlayHint} {...stylex.props(styles.hintTab)}>
            <Lightbulb size={icon.table} strokeWidth={icon.outline} />
          </button>
        ) : null}

        <div {...stylex.props(styles.mine)}>
          <Fan
            testId="skat-hand"
            cards={myHand}
            size="table"
            row
            onPick={onCard}
            selected={picked}
            legal={legal}
            glow={hint?.card ? [hint.card] : hint?.cards ?? []}
          />
        </div>
      </div>

      <aside data-testid="skat-panel" data-open={String(panelOpen)} {...stylex.props(styles.panel, fullScreen && styles.panelFull, fullScreen && panelOpen && styles.panelOpen)}>
        {fullScreen ? (
          <button type="button" aria-label={m.table_panel_toggle()} aria-expanded={panelOpen} data-testid="skat-panel-toggle" onClick={() => setPanelOpen((o) => !o)} {...stylex.props(styles.panelTab)}>
            {panelOpen ? <ChevronRight size={icon.inline} strokeWidth={icon.outline} /> : <ChevronLeft size={icon.inline} strokeWidth={icon.outline} />}
          </button>
        ) : null}

        <div {...stylex.props(styles.panelBody)}>
          {fullScreen ? (
            <div {...stylex.props(styles.tabs)}>
              <span data-state="active" {...stylex.props(styles.tab)}>
                <span {...stylex.props(styles.tabTile, styles.tabTileActive)}><Spade size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.railLabel)}>{m.table_game_tab()}</span>
              </span>
              <Link to="/course" {...stylex.props(styles.tab, styles.tabLink)}>
                <span {...stylex.props(styles.tabTile)}><GraduationCap size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.railLabel)}>{m.nav_course()}</span>
              </Link>
              <button type="button" data-testid="settings-open-table" onClick={() => setSettingsOpen(true)} {...stylex.props(typography.control, styles.tab, styles.tabLink, styles.tabButton)}>
                <span {...stylex.props(styles.tabTile)}><Settings size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.railLabel)}>{m.settings_open()}</span>
              </button>
            </div>
          ) : null}

          <section data-testid="skat-history" {...stylex.props(styles.history)}>
            <h2 {...stylex.props(typography.panelLabel, styles.panelTitle)}>{m.table_history()}</h2>
            <div {...stylex.props(styles.auction)}>
              {([1, ME, 2] as Seat[]).map((seat) => (
                <div key={seat} {...stylex.props(styles.auctionCol)}>
                  <span {...stylex.props(typography.auctionHead, styles.auctionHead)}>{nameOf(seat)}</span>
                  {/* Where the seat sits this deal, so the order of the bids reads (SKATGO-29). */}
                  <span data-testid="skat-history-role" {...stylex.props(typography.infoSub, styles.auctionRole)}>{roleName(roleOf(seat, game.dealer))}</span>
                  <div {...stylex.props(styles.auctionCells)}>
                    {game.bidding.log
                      .filter((e) => e.seat === seat)
                      .map((e, i) => (
                        <span key={i} {...stylex.props(typography.bidChip, styles.chip, e.say === 'pass' ? styles.chipPass : styles.chipBid)}>
                          {e.say === 'pass' ? m.bid_pass() : e.value}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div data-testid="skat-strip" {...stylex.props(styles.strip)}>
            {contract ? <Pill tone="amber">{contractName(contract)}{game.declaration?.hand ? ' · Hand' : ''}{game.declaration?.ouvert ? ' · Ouvert' : ''}</Pill> : null}
            {game.declarer !== null ? <Pill tone="quiet">{m.table_declarer({ name: nameOf(game.declarer), bid: game.bid })}</Pill> : null}
            {game.phase === 'play' || game.phase === 'trickEnd' ? (
              <Pill tone="quiet">{m.table_trick_count({ n: Math.min(10, game.tricks.length + 1), declarer: points.declarer, defenders: points.defenders })}</Pill>
            ) : null}
          </div>

          <div {...stylex.props(styles.panelFoot)}>
            {fullScreen ? (
              <Link to="/" data-testid="skat-leave" {...linkLook('stop', 'md', 'block')}>{m.table_leave()}</Link>
            ) : null}
          </div>
        </div>
      </aside>

      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}

      {/* The settlement and a passed-in deal are dialogs over the whole table, outside the panel, which
          on a phone is a drawer that slides. */}
      {dialog ? (
        <div data-testid="skat-actions">
          <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} setGame={setGame} setPicked={setPicked} setHint={setHint} onNewGame={newGame} />
        </div>
      ) : null}
    </div>
  )
}

/** Every move the learner can make now, wired to the game. */
function ActionsFor({
  game,
  picked,
  draft,
  setDraft,
  setGame,
  setPicked,
  setHint,
  onNewGame,
}: {
  game: Game
  picked: Card[]
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  setGame: (update: (g: Game) => Game) => void
  setPicked: (cards: Card[]) => void
  setHint: (h: { card?: Card; cards?: Card[]; text: string } | null) => void
  onNewGame: () => void
}) {
  return (
    <Actions
      game={game}
      picked={picked}
      draft={draft}
      setDraft={setDraft}
      onBid={(a) => setGame((g) => bidAction(g, a))}
      onPickUp={() => setGame((g) => pickUpSkat(g))}
      onHand={() => setGame((g) => playHand(g))}
      onDiscard={() => {
        setGame((g) => discard(g, picked))
        setPicked([])
      }}
      onDeclare={(d) => {
        setGame((g) => declare(g, d))
        setDraft(null)
      }}
      onBidHint={() => setHint(bidHint(game))}
      onSkatHint={() => setHint(skatHint(game))}
      onDeclareHint={() => setHint(declareHint(game))}
      onDiscardHint={() => setHint(discardHint(game))}
      onPlayHint={() => {
        const h = playHint(game)
        if (h) setHint(h)
      }}
      onNewGame={onNewGame}
    />
  )
}

/** An opponent's hand: the same card as the learner's, turned sideways, stacked down the felt's edge
 *  and running off it — face up for an Ouvert declarer, face down otherwise. */
function Stack({ seat, game }: { seat: Seat; game: Game }) {
  const open = game.declarer === seat && game.declaration?.ouvert && (game.phase === 'play' || game.phase === 'trickEnd')
  const cards = open ? sortHand(game.hands[seat], game.declaration!.contract) : game.hands[seat]
  return (
    <div data-testid={`skat-stack-${seat}`} aria-hidden={open ? undefined : 'true'} {...stylex.props(styles.stack, seat === 1 ? styles.stackLeft : styles.stackRight)}>
      {cards.map((c, i) => (
        <div key={open ? cardId(c) : i} {...stylex.props(styles.sideSlot)}>
          <span {...stylex.props(styles.sideCard)}>
            <PlayingCard card={c} faceDown={!open} size="table" />
          </span>
        </div>
      ))}
    </div>
  )
}

/** A seat plate: the role tag and the name — nothing else, so it never has to be cut short. Scores,
 *  the contract and the count are on the info board at the top of the felt. The learner's is amber. */
function Plate({ seat, game, mine, active }: { seat: Seat; game: Game; mine?: boolean; active: boolean }) {
  const role = roleName(roleOf(seat, game.dealer))
  return (
    <div data-testid={mine ? 'skat-plate-me' : undefined} data-active={String(active)} title={role} {...stylex.props(styles.plate, mine && styles.plateMine, active && styles.plateActive)}>
      <span aria-hidden="true" {...stylex.props(typography.roleTag, styles.roleTag)}>{role.slice(0, 1).toUpperCase()}</span>
      <span {...stylex.props(typography.plateName, styles.plateText)}>{nameOf(seat)}</span>
    </div>
  )
}

/** The info board across the top of the felt: what is being played, by whom, how the hand stands, and
 *  the running totals — each a small label over its value, divided by fine rules. */
function InfoBoard({ game, scores, points }: { game: Game; scores: [number, number, number]; points: { declarer: number; defenders: number } }) {
  const contract = game.declaration?.contract ?? null
  const playing = game.phase === 'play' || game.phase === 'trickEnd'
  const extras = `${game.declaration?.hand ? ' · Hand' : ''}${game.declaration?.ouvert ? ' · Ouvert' : ''}`
  return (
    <section data-testid="skat-info" aria-label={m.info_label()} {...stylex.props(styles.board)}>
      <div data-testid="skat-info-contract" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{contract ? m.info_contract() : m.info_bid()}</span>
        {contract ? (
          <span {...stylex.props(typography.infoValue, styles.boardValue)}><Rich text={contractName(contract)} />{extras}</span>
        ) : (
          <span {...stylex.props(typography.infoNumber, styles.boardValue)}>{game.bidding.value > 0 ? game.bidding.value : '—'}</span>
        )}
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{!contract && game.declarer === null ? m.table_bidding() : ''}</span>
      </div>
      <div {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_declarer()}</span>
        <span {...stylex.props(typography.infoValue, styles.boardValue)}>{game.declarer === null ? '—' : nameOf(game.declarer)}</span>
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{game.declarer === null ? '' : m.info_bid() + ' ' + game.bid}</span>
      </div>
      <div data-testid="skat-info-points" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_points()}</span>
        <span {...stylex.props(typography.infoNumber, styles.boardValue)}>{playing ? `${points.declarer} : ${points.defenders}` : '—'}</span>
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{playing ? m.info_tricks({ n: Math.min(10, game.tricks.length + 1) }) : ''}</span>
      </div>
      <div data-testid="skat-info-totals" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_totals()}</span>
        <div {...stylex.props(styles.totals)}>
          {([1, ME, 2] as Seat[]).map((seat) => (
            <span key={seat} {...stylex.props(styles.total)}>
              <span {...stylex.props(typography.infoNumber, styles.boardValue, seat === ME && styles.boardMine)}>{scores[seat]}</span>
              <span {...stylex.props(typography.infoSub, styles.boardSub)}>{nameOf(seat)}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

type ActionsProps = {
  game: Game
  picked: Card[]
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  onBid: (a: 'bid' | 'hold' | 'pass') => void
  onPickUp: () => void
  onHand: () => void
  onDiscard: () => void
  onDeclare: (d: Declaration) => void
  onBidHint: () => void
  onSkatHint: () => void
  onDeclareHint: () => void
  onDiscardHint: () => void
  onPlayHint: () => void
  onNewGame: () => void
}

function Actions(p: ActionsProps) {
  const { game } = p
  const who = actor(game)

  if (game.phase === 'passedIn') {
    return (
      <Dialog>
        <Say>{m.table_passed_in()}</Say>
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={p.onNewGame}>{m.table_redeal()}</Btn>
      </Dialog>
    )
  }

  if (game.phase === 'done' && game.result && game.declarer !== null) {
    return <Result game={game} onNewGame={p.onNewGame} />
  }

  if (who !== ME) {
    const name = who === null ? '' : nameOf(who)
    const doing =
      game.phase === 'trickEnd'
        ? m.table_collecting()
        : game.phase === 'bidding'
          ? m.table_thinking_bid({ name })
          : game.phase === 'play'
            ? m.table_thinking_play({ name })
            : m.table_thinking_skat({ name })
    return <Row><Say>{doing}</Say></Row>
  }

  if (game.phase === 'bidding') {
    const b = game.bidding
    if (b.awaiting === 'forehandAlone') {
      return (
        <Row>
          <Say>{m.bid_forehand_alone()}</Say>
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}>{m.bid_take_18()}</Btn>
          <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
        </Row>
      )
    }
    if (b.awaiting === 'speaker') {
      const value = nextBid(b.value)
      return (
        <Row>
          <Say>{m.bid_your_turn({ name: nameOf(b.listener) })}</Say>
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}>{m.bid_button({ value: value ?? '' })}</Btn>
          <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.bid_asked({ name: nameOf(b.speaker), value: b.value })}</Say>
        <Btn testId="skat-hold" shape="block" size="lg" onClick={() => p.onBid('hold')}>{m.bid_hold_button({ value: b.value })}</Btn>
        <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
        <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'skat') {
    if (!game.pickedUp) {
      return (
        <Row>
          <Say>{m.skat_won_bid({ bid: game.bid })}</Say>
          <Btn testId="skat-pickup" shape="block" size="lg" onClick={p.onPickUp}>{m.skat_pick_up()}</Btn>
          <Btn testId="skat-hand-game" tone="quiet" shape="block" size="lg" onClick={p.onHand}>{m.skat_play_hand()}</Btn>
          <Btn testId="skat-skat-hint" tone="info" shape="block" size="lg" onClick={p.onSkatHint}>{m.skat_hint_button()}</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.skat_discard_prompt()}</Say>
        <Btn testId="skat-discard" shape="block" size="lg" disabled={p.picked.length !== 2} onClick={p.onDiscard}>{m.skat_discard_button({ n: p.picked.length })}</Btn>
        <Btn tone="info" shape="block" size="lg" onClick={p.onDiscardHint}>{m.skat_discard_hint_button()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'declare') {
    return <DeclarePicker game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} onHint={p.onDeclareHint} />
  }

  return (
    <Row>
      <Say>{game.trick.length === 0 ? m.play_lead_any() : m.play_tap()}</Say>
    </Row>
  )
}

const CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

function DeclarePicker({
  game,
  draft,
  setDraft,
  onDeclare,
  onHint,
}: {
  game: Game
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  onDeclare: (d: Declaration) => void
  onHint: () => void
}) {
  const isHand = !game.pickedUp
  // Matadors are counted over hand plus skat, but in a Hand game the skat is unseen: the learner can
  // only count what they hold, which is exactly the uncertainty the lesson on Hand games describes.
  const known = isHand ? game.hands[ME] : [...game.hands[ME], ...game.skat]
  const make = (contract: Contract, extra: Partial<Declaration> = {}): Declaration =>
    normalise({ contract, hand: isHand, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false, ...extra }, game.pickedUp)
  const value = draft ? expectedValue(draft, known) : null
  const same = (a: Contract, b: Contract) => JSON.stringify(a) === JSON.stringify(b)

  return (
    <div {...stylex.props(styles.declare)}>
      <Say><Rich text={m.declare_prompt({ bid: game.bid })} /></Say>
      <div {...stylex.props(styles.contractGrid)}>
        {CONTRACTS.map((c) => {
          const v = expectedValue(make(c), known)
          const chosen = draft !== null && same(draft.contract, c)
          return (
            <button
              key={JSON.stringify(c)}
              type="button"
              data-testid={`skat-contract-${c.kind === 'suit' ? c.trump : c.kind}`}
              data-covers={String(v >= game.bid)}
              aria-pressed={chosen}
              onClick={() => setDraft(make(c))}
              {...stylex.props(typography.contractTile, styles.contractBtn, contractTint[tintOf(c)], chosen && styles.contractChosen, v < game.bid && styles.contractShort)}
            >
              <span><Rich text={contractName(c)} /></span>
              <span {...stylex.props(typography.micro, styles.contractValue)}>{m.declare_worth({ value: v })}{v < game.bid ? m.declare_short() : ''}</span>
            </button>
          )
        })}
      </div>
      {draft ? (
        <div {...stylex.props(styles.toggles)}>
          {draft.contract.kind === 'null' ? (
            <Toggle on={draft.ouvert} onClick={() => setDraft(make(draft.contract, { ouvert: !draft.ouvert }))}>{m.declare_null_ouvert()}</Toggle>
          ) : isHand ? (
            <>
              <Toggle on={draft.schneiderAnnounced} onClick={() => setDraft(make(draft.contract, { schneiderAnnounced: !draft.schneiderAnnounced }))}>
                {m.declare_announce_schneider()}
              </Toggle>
              <Toggle on={draft.schwarzAnnounced} onClick={() => setDraft(make(draft.contract, { schwarzAnnounced: !draft.schwarzAnnounced }))}>
                {m.declare_announce_schwarz()}
              </Toggle>
              <Toggle on={draft.ouvert} onClick={() => setDraft(make(draft.contract, { ouvert: !draft.ouvert }))}>Ouvert</Toggle>
            </>
          ) : null}
        </div>
      ) : null}
      {draft && value !== null ? (
        <Panel tone={value >= game.bid ? 'good' : 'bad'}>
          <p {...stylex.props(typography.note, styles.note)}>
            {value >= game.bid
              ? m.declare_covers({ contract: `${contractName(draft.contract)}${draft.hand ? ' Hand' : ''}`, value, bid: game.bid })
              : m.declare_overbid({ contract: contractName(draft.contract), value, bid: game.bid })}
            {isHand && draft.contract.kind !== 'null' ? m.declare_hand_note() : ''}
          </p>
        </Panel>
      ) : null}
      <Row>
        <Btn testId="skat-declare" shape="block" size="lg" grow disabled={!draft} onClick={() => draft && onDeclare(draft)}>{m.declare_go()}</Btn>
        <Btn testId="skat-declare-hint" tone="info" shape="block" size="lg" onClick={onHint}>{m.declare_hint_button()}</Btn>
      </Row>
    </div>
  )
}

function Result({ game, onNewGame }: { game: Game; onNewGame: () => void }) {
  const r = game.result!
  const declarer = game.declarer!
  const d = game.declaration!
  const humanWon = declarer === ME ? r.won : !r.won
  const isNull = d.contract.kind === 'null'
  // On a phone the settlement opens below the fold; bring it into view, or the game just seems to stop.
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])
  const formula = isNull
    ? m.result_null_formula({ contract: `Null${d.hand ? ' Hand' : ''}${d.ouvert ? ' Ouvert' : ''}`, value: r.value })
    : m.result_formula_mult({
        parts: r.parts.map((p, i) => (i === 0 ? partLabel(p, r.matadors) : `${partLabel(p, r.matadors)} 1`)).join(' + '),
        mult: r.multiplier,
        contract: contractName(d.contract),
        base: r.base,
        value: r.base * r.multiplier,
      })
  return (
    <Dialog>
    <div ref={panel} data-testid="skat-result" data-human-won={String(humanWon)} {...stylex.props(styles.declare)}>
      <Panel tone={humanWon ? 'good' : 'bad'}>
        <div {...stylex.props(styles.resultBody)}>
          <h3 {...stylex.props(typography.dialogTitle, styles.resultTitle)}>{humanWon ? m.result_won() : m.result_lost()}</h3>
          <p {...stylex.props(typography.note, styles.note)}>
            <Rich
              text={m.result_line({
                who: declarer === ME ? m.result_you_declared() : m.result_other_declared({ name: nameOf(declarer) }),
                contract: contractName(d.contract),
                bid: game.bid,
                reason: settleReason(r.reason),
              })}
            />
          </p>
          {isNull ? null : (
            <p data-testid="skat-result-points" {...stylex.props(typography.note, styles.note)}>
              <Rich text={m.result_points({ declarer: r.declarerPoints, defenders: r.defenderPoints })} />
            </p>
          )}
          <p data-testid="skat-result-formula" {...stylex.props(typography.note, styles.note)}>{m.result_formula({ formula })}</p>
          <p {...stylex.props(typography.note, styles.note)}>
            <Rich text={scoreLine(declarer, r.won, r.score > 0 ? `+${r.score}` : String(r.score))} />
          </p>
          <div {...stylex.props(styles.resultSkat)}>
            <span {...stylex.props(typography.smallBold, styles.inkLabel)}>{m.result_skat()}</span>
            {game.skat.map((c) => <PlayingCard key={cardId(c)} card={c} size="xs" />)}
          </div>
        </div>
      </Panel>
      <Row>
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={onNewGame}>{m.result_new_game()}</Btn>
      </Row>
    </div>
    </Dialog>
  )
}

/** "You score +30." — who wrote down what, and why it is doubled when it is. */
function scoreLine(declarer: Seat, won: boolean, score: string): string {
  if (declarer === ME) return won ? m.result_score_you({ score }) : m.result_score_lost_you({ score })
  const name = nameOf(declarer)
  return won ? m.result_score({ name, score }) : m.result_score_lost({ name, score })
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} {...stylex.props(typography.toggle, styles.toggle, on && styles.toggleOn)}>
      {on ? '☑' : '☐'} {children}
    </button>
  )
}

const Row = ({ children }: { children: ReactNode }) => <div {...stylex.props(styles.row)}>{children}</div>
/** A message at the top of the felt (SKATGO-32): a hint or a refusal, with a way to close it. */
function Message({ tone, testId, onClose, children }: { tone: 'tip' | 'bad'; testId?: string; onClose: () => void; children: ReactNode }) {
  return (
    <Panel tone={tone}>
      <div data-testid={testId} {...stylex.props(styles.message)}>
        <p {...stylex.props(typography.appText, styles.note, styles.messageText)}>{children}</p>
        <button type="button" aria-label={m.message_close()} onClick={onClose} {...stylex.props(styles.messageClose)}>
          <X size={icon.inline} strokeWidth={icon.outline} />
        </button>
      </div>
    </Panel>
  )
}

const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(typography.appText, styles.say)}>{children}</p>

/** A dialog over the table: white, on the scrim, one full-width green action inside. */
function Dialog({ children }: { children: ReactNode }) {
  return (
    <div data-testid="skat-dialog" {...stylex.props(styles.scrim)}>
      <div role="dialog" aria-modal="false" {...stylex.props(styles.dialog)}>
        {children}
      </div>
    </div>
  )
}

type Tint = 'C' | 'S' | 'H' | 'D' | 'grand' | 'null'
const tintOf = (c: Contract): Tint => (c.kind === 'suit' ? c.trump : c.kind)


const styles = stylex.create({
  // Clipped, not hidden (SKATGO-32): a hidden overflow can still be scrolled by focus or scrollIntoView,
  // which slid the whole felt sideways; a clipped one cannot scroll at all.
  table: { position: 'relative', display: 'grid', backgroundColor: color.page, overflow: 'clip' },
  // Free play: the felt fills the screen; the panel is a drawer over it (SKATGO-29).
  tableFull: { gridTemplateColumns: dims.oneColumn, minHeight: dims.screenDynamic },
  // Inside a lesson: the panel stacks under the felt.
  tableEmbedded: { gridTemplateColumns: dims.oneColumn, borderRadius: radii.panel },

  felt: {
    position: 'relative',
    minHeight: dims.tableEmbedded,
    overflow: 'clip',
    backgroundImage: fill.felt,
    color: color.onColor,
  },
  feltFull: { minHeight: dims.screenDynamic },

  // An opponent's hand down an edge, only partly on the felt.
  stack: {
    position: 'absolute',
    top: { default: dims.frameTop, [bp.phone]: dims.frameTopPhone },
    display: 'flex',
    flexDirection: 'column',
    transform: pose.centreY,
  },
  stackLeft: { left: { default: dims.sideInset, [bp.phone]: dims.sideInsetPhone } },
  stackRight: { right: { default: dims.sideInset, [bp.phone]: dims.sideInsetPhone } },
  sideSlot: {
    position: 'relative',
    flexShrink: 0,
    width: { default: dims.sideSlotWidth, [bp.phone]: dims.sideSlotWidthPhone },
    height: { default: dims.sideSlotHeight, [bp.phone]: dims.sideSlotHeightPhone },
    marginTop: { default: dims.sideStep, [bp.phone]: dims.sideStepPhone, ':first-child': 0 },
  },
  sideCard: { position: 'absolute', top: dims.half, left: dims.half, display: 'block', transform: pose.sideways },

  frame: {
    position: 'absolute',
    top: { default: dims.frameTop, [bp.phone]: dims.frameTopPhone },
    left: dims.half,
    transform: pose.centre,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    borderColor: color.gold,
  },
  framePlay: { width: { default: dims.framePlay, [bp.phone]: dims.framePhone }, aspectRatio: dims.square, borderWidth: dims.frameBorderPlay },

  plateSlot: { position: 'absolute', display: 'flex' },
  plateSlotLeft: { left: 0, top: dims.half, transform: pose.plateLeft },
  plateSlotRight: { right: 0, top: dims.half, transform: pose.plateRight },
  plateSlotBottom: { left: dims.half, bottom: 0, transform: pose.plateBottom },
  plate: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x6,
    minHeight: dims.plateHeight,
    boxSizing: 'border-box',
    paddingRight: space.x12,
    borderRadius: radii.tag,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: color.plate,
    color: color.onColor,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  plateMine: { backgroundColor: color.amber, color: color.plate },
  plateActive: { borderColor: color.gold },
  roleTag: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.roleTag,
    height: dims.roleTag,
    borderRadius: radii.tag,
    backgroundColor: color.roleTag,
    color: color.onColor,
  },
  plateText: { whiteSpace: 'nowrap' },

  saidChip: { position: 'absolute', bottom: space.x32 },
  saidLeft: { left: space.x12 },
  saidRight: { right: space.x12 },

  // The info board hangs from the felt's top edge (SKATGO-29): square on top, rounded below.
  // The top of the felt: the board, then the messages, centred; empty space in it lets taps through.
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: layer.launcher,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x8,
    pointerEvents: 'none',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    width: dims.tipWidth,
    pointerEvents: 'auto',
  },
  message: { display: 'flex', alignItems: 'flex-start', gap: space.x8 },
  messageText: { flexGrow: 1, minWidth: 0 },
  messageClose: {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.slate,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
  },
  board: {
    pointerEvents: 'auto',
    display: 'grid',
    gridTemplateColumns: dims.boardColumns,
    justifyContent: 'center',
    width: { default: dims.boardWidth, [bp.phone]: dims.boardWidthPhone },
    boxSizing: 'border-box',
    borderBottomLeftRadius: radii.panel,
    borderBottomRightRadius: radii.panel,
    backgroundColor: color.board,
    color: color.onColor,
  },
  boardCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x4,
    minWidth: 0,
    paddingBlock: { default: space.x10, [bp.phone]: space.x8 },
    paddingInline: { default: space.x16, [bp.phone]: space.x8 },
    // Two rows of two: a rule between the columns and one between the rows.
    borderLeftWidth: { default: border.hair, ':nth-child(odd)': 0 },
    borderLeftStyle: 'solid',
    borderLeftColor: color.boardLine,
    borderTopWidth: { default: 0, ':nth-child(n+3)': border.hair },
    borderTopStyle: 'solid',
    borderTopColor: color.boardLine,
    textAlign: 'center',
  },
  boardLabel: { color: color.amber, whiteSpace: 'nowrap' },
  boardValue: { color: color.onColor, whiteSpace: 'nowrap' },
  boardMine: { color: color.amber },
  boardSub: { color: color.onColorSoft, whiteSpace: 'nowrap', minHeight: space.x12 },
  totals: { display: 'flex', gap: space.x12 },
  total: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x2 },

  // The skat and its label, in the frame's middle.
  skatPile: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6, width: '100%' },
  skatCards: { display: 'flex', justifyContent: 'center', gap: space.x6, width: '100%' },
  // A card lying in the frame — the skat or a played card — is always 26% of the frame's width.
  frameCard: { display: 'block', width: dims.trickCard },
  goldLabel: { color: color.amber },
  trickCard: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', width: dims.trickCard },
  // The words about the play, outside the frame: over it on a desk, growing upward; under it on a
  // phone, below the learner's plate — the phone's info board leaves no room above.
  above: {
    position: 'absolute',
    bottom: { default: '100%', [bp.phone]: 'auto' },
    top: { default: 'auto', [bp.phone]: '100%' },
    paddingTop: { default: 0, [bp.phone]: space.x24 },
    left: dims.half,
    transform: pose.centreX,
    zIndex: layer.window,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x8,
    width: dims.tipWidth,
    paddingBottom: { default: space.x12, [bp.phone]: 0 },
    pointerEvents: 'none',
  },
  words: {
    paddingBlock: space.x6,
    paddingInline: space.x16,
    borderRadius: radii.pill,
    backgroundColor: color.board,
    color: color.onColor,
    textAlign: 'center',
  },

  // The action drawer: white, rounded at the top, over the felt and just above the hand.
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginInline: 'auto',
    bottom: { default: dims.drawerBottom, [bp.phone]: dims.drawerBottomPhone },
    zIndex: layer.window,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    width: dims.drawerWidth,
    maxHeight: { default: dims.drawerMaxHeight, [bp.phone]: dims.drawerMaxHeightPhone },
    overflowY: 'auto',
    boxSizing: 'border-box',
    paddingTop: space.x8,
    paddingBottom: space.x16,
    paddingInline: space.x16,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
    color: color.navy,
  },
  drawerHandle: {
    alignSelf: 'center',
    flexShrink: 0,
    width: dims.drawerHandle,
    height: dims.drawerHandleHeight,
    borderRadius: radii.round,
    backgroundColor: color.hairline,
  },

  hintTab: {
    position: 'absolute',
    left: 0,
    bottom: dims.hintTabBottom,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.hintTabWidth,
    height: dims.hintTabHeight,
    padding: 0,
    borderWidth: 0,
    borderTopRightRadius: radii.panel,
    borderBottomRightRadius: radii.panel,
    backgroundColor: color.hintTab,
    color: color.onColor,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.gold,
  },

  // The learner's hand: a row along the bottom, the same card size as the opponents'.
  mine: { position: 'absolute', left: 0, right: 0, bottom: space.x12, display: 'flex', justifyContent: 'center', paddingInline: { default: space.x16, [bp.phone]: space.x6 }, boxSizing: 'border-box' },

  panel: { position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: color.page, color: color.text },
  // A drawer at any width: over the felt's right side on a wide screen, over the whole screen on a phone.
  panelFull: {
    position: { default: 'absolute', [bp.phone]: 'fixed' },
    top: 0,
    right: 0,
    bottom: { default: 0, [bp.phone]: 'auto' },
    zIndex: layer.window,
    width: { default: dims.sidePanel, [bp.phone]: dims.panelPhone },
    height: { default: 'auto', [bp.phone]: dims.screenDynamic },
    transform: pose.offRight,
    transitionProperty: 'transform',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    borderTopLeftRadius: radii.panel,
    borderBottomLeftRadius: radii.panel,
    boxShadow: elev.panel,
  },
  panelOpen: { transform: pose.onScreen },
  // The white tab that folds the panel away and brings it back, at any width.
  // The drawer's handle mirrors the hint tab's place (SKATGO-29): the same height from the bottom, on the
  // right edge — a slim tab, so it never competes with the table.
  panelTab: {
    display: 'flex',
    position: 'absolute',
    bottom: dims.hintTabBottom,
    left: dims.panelTabOffset,
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.panelTab,
    height: dims.panelTabHeight,
    padding: 0,
    borderWidth: 0,
    borderTopLeftRadius: radii.panel,
    borderBottomLeftRadius: radii.panel,
    backgroundColor: color.surface,
    color: color.navy,
    boxShadow: elev.panel,
    cursor: 'pointer',
  },
  panelBody: { display: 'flex', flexDirection: 'column', gap: space.x16, flexGrow: 1, padding: space.x16, overflowY: 'auto' },
  tabs: { display: 'flex', justifyContent: 'space-around', paddingBottom: space.x16, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  tab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4, color: color.slateDeep, textDecoration: 'none' },
  tabLink: { outlineStyle: { default: 'none', ':focus-visible': 'solid' }, outlineWidth: border.focus, outlineColor: color.info },
  tabTile: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: dims.tabTile, height: dims.tabTile, borderRadius: radii.panel, backgroundColor: color.hairline, color: color.navy },
  tabTileActive: { backgroundColor: color.tabActive },
  tabButton: { padding: 0, borderWidth: 0, backgroundColor: 'transparent', cursor: 'pointer' },
  history: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  panelTitle: { margin: 0, color: color.navy, textAlign: 'center' },
  auction: { display: 'grid', gridTemplateColumns: dims.auctionColumns, gap: space.x8 },
  auctionCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6 },
  auctionHead: { color: color.auctionHead, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  auctionRole: { color: color.slate, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  // A column of bids is as wide as its bids (SKATGO-29), never narrower than one.
  auctionCells: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x4,
    minWidth: dims.auctionCell,
    minHeight: dims.auctionHeight,
    padding: space.x6,
    boxSizing: 'border-box',
    borderRadius: radii.column,
    backgroundColor: color.plate,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: dims.roleTag,
    paddingBlock: space.x6,
    paddingInline: space.x8,
    borderRadius: radii.tag,
  },
  chipPass: { backgroundColor: color.go, color: color.onColor },
  chipBid: { backgroundColor: color.tintHearts, color: color.plate },
  strip: { display: 'flex', flexWrap: 'wrap', gap: space.x6, justifyContent: 'center' },
  panelFoot: { display: 'flex', flexDirection: 'column', gap: space.x12, marginTop: 'auto' },

  // A row of moves is centred under what is asked, in the drawer and in a dialog alike.
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.x10 },
  // A line said takes the colour of where it is said: navy in the drawer, white over the felt.
  say: { margin: 0, flexBasis: '100%', color: 'inherit', textAlign: 'center' },
  note: { margin: 0, color: color.text },
  declare: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  contractGrid: { display: 'grid', gridTemplateColumns: { default: dims.contractColumns, [bp.contracts]: dims.contractColumnsPhone }, gap: space.x8 },
  contractBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x2,
    paddingBlock: space.x12,
    paddingInline: space.x4,
    borderRadius: radii.column,
    borderWidth: border.frame,
    borderStyle: 'solid',
    borderColor: 'transparent',
    color: color.plate,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  contractChosen: { borderColor: color.navy },
  contractShort: { opacity: opacity.spent },
  contractValue: { color: color.slateDeep },
  toggles: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  toggle: {
    minHeight: dims.control,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
    color: color.navy,
    borderRadius: radii.pill,
    paddingInline: space.x16,
    cursor: 'pointer',
  },
  toggleOn: { backgroundColor: color.goodSoft, borderColor: color.go },
  resultBody: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  resultTitle: { margin: 0, color: color.navy },
  resultSkat: { display: 'flex', alignItems: 'center', gap: space.x6 },
  inkLabel: { color: color.slate },

  scrim: {
    position: 'absolute',
    inset: 0,
    zIndex: layer.window,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.x16,
    backgroundColor: color.scrim,
  },
  dialog: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: dims.dialogWidth,
    maxHeight: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: space.x24,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
  },
})

// One tint per game, as the reference tints its bid box by strain (Grand and Null derived).
const contractTint = stylex.create({
  C: { backgroundColor: color.tintClubs },
  S: { backgroundColor: color.tintSpades },
  H: { backgroundColor: color.tintHearts },
  D: { backgroundColor: color.tintDiamonds },
  grand: { backgroundColor: color.tintGrand },
  null: { backgroundColor: color.tintNull },
})

// The three places a played card lands in the frame, in the reference's proportions: both opponents'
// cards level near the top, each on their own side; the learner's lower, centred.
const positions = stylex.create({
  0: { left: dims.trickMineLeft, top: dims.trickMineTop },
  1: { left: dims.trickSideInset, top: dims.trickSideTop },
  2: { right: dims.trickSideInset, top: dims.trickSideTop },
})
