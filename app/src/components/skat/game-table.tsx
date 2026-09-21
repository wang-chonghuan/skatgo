import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { bidAdvice, chooseDeclaration } from '~/lib/skat/ai'
import {
  type Card,
  type Contract,
  SUITS,
  SUIT_NAME,
  SUIT_SYMBOL,
  cardId,
  cardLabel,
  contractName,
  effectiveSuit,
  sameCard,
  sortHand,
} from '~/lib/skat/cards'
import {
  type Game,
  type Seat,
  ROLE_NAME,
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
import { skat } from '../../theme/skat.stylex'
import { Fan } from './card-row'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Pill, Rich } from './ui'

// A whole game of Skat against two computer players. All rules live in ~/lib/skat/game; this file
// renders a state and dispatches the learner's moves, and lets the computers move on a timer so the
// learner can follow what happened.

const ME: Seat = 0
const NAMES: Record<Seat, string> = { 0: '你', 1: '莉娜', 2: '马克斯' }
const FACES: Record<Seat, string> = { 0: '🙂', 1: '👩‍🦰', 2: '🧔' }

const BOT_DELAY = 850
const TRICK_DELAY = 1300

type Props = {
  /** Called once per game, when it is settled. */
  onSettled?: (info: { humanWon: boolean; humanScore: number }) => void
}

export function GameTable({ onSettled }: Props) {
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
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } })
    }
  }, [game, onSettled])

  // Anything said about the previous state is stale once the state moves on.
  useEffect(() => {
    setHint(null)
    setRefusal(null)
  }, [game])

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
      const led = effectiveSuit(game.trick[0].card, contract)
      const name = led === 'T' ? '主牌' : `${SUIT_NAME[led]}${SUIT_SYMBOL[led]}`
      setRefusal(`必须跟牌：首出的是**${name}**，你手里还有${name}，就得出${name}。`)
      return
    }
    setGame((g) => playCard(g, card))
  }

  function showPlayHint() {
    const advice = adviceFor(game, ME)
    if (advice) setHint({ card: advice.card, text: `建议出 **${cardLabel(advice.card)}**。${advice.reason}` })
  }

  const lastBidBy = (seat: Seat) => {
    const events = game.bidding.log.filter((e) => e.seat === seat)
    const e = events[events.length - 1]
    if (!e) return null
    return e.say === 'pass' ? '过' : e.say === 'hold' ? `有（${e.value}）` : `${e.value}？`
  }

  return (
    <div data-testid="skat-table" data-phase={game.phase} {...stylex.props(styles.table)}>
      <div {...stylex.props(styles.opponents)}>
        {([1, 2] as Seat[]).map((seat) => (
          <SeatBadge
            key={seat}
            seat={seat}
            game={game}
            active={who === seat}
            said={game.phase === 'bidding' || game.phase === 'passedIn' ? lastBidBy(seat) : null}
            score={scores[seat]}
          />
        ))}
      </div>

      <div {...stylex.props(styles.centre)}>
        {/* The pile is on the table until somebody picks it up; after that the two cards are in a hand. */}
        {(game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'passedIn') && game.skat.length > 0 ? (
          <div {...stylex.props(styles.skatPile)}>
            <div {...stylex.props(styles.skatCards)}>
              {game.skat.map((c, i) => (
                <PlayingCard key={i} card={c} faceDown size="sm" />
              ))}
            </div>
            <span {...stylex.props(styles.feltLabel)}>底牌</span>
          </div>
        ) : null}

        <AnimatePresence>
          {game.trick.map((p) => (
            <motion.div
              key={cardId(p.card)}
              initial={{ opacity: 0, scale: 0.7, ...FROM[p.seat] }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              {...stylex.props(styles.trickCard, positions[p.seat])}
            >
              <PlayingCard card={p.card} size="md" glow={game.phase === 'trickEnd' && winner === p.seat} />
              <span {...stylex.props(styles.feltLabel)}>{NAMES[p.seat]}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {game.phase === 'trickEnd' && winner !== null ? (
          <div {...stylex.props(styles.trickNote)}>
            <Pill tone="brass">{NAMES[winner]}赢下这一墩</Pill>
          </div>
        ) : null}
      </div>

      <div {...stylex.props(styles.strip)}>
        {contract ? <Pill tone="brass">{contractName(contract)}{game.declaration?.hand ? ' · Hand' : ''}{game.declaration?.ouvert ? ' · Ouvert' : ''}</Pill> : <Pill tone="felt">{game.declarer === null ? '叫牌中' : '等待定约'}</Pill>}
        {game.declarer !== null ? <Pill tone="felt">庄家：{NAMES[game.declarer]} · 叫到 {game.bid}</Pill> : null}
        {game.phase === 'play' || game.phase === 'trickEnd' ? (
          <Pill tone="felt">第 {Math.min(10, game.tricks.length + 1)} / 10 墩 · 庄家 {points.declarer} 点 · 防守 {points.defenders} 点</Pill>
        ) : null}
      </div>

      <div {...stylex.props(styles.mine)}>
        <div {...stylex.props(styles.mineHead)}>
          <Pill tone="felt">{FACES[ME]} 你 · {ROLE_NAME[roleOf(ME, game.dealer)]}{game.declarer === ME ? ' · 庄家' : game.declarer !== null ? ' · 防守方' : ''}</Pill>
          <Pill tone="felt">总分 {scores[ME]}</Pill>
          {myTurn && game.phase === 'play' ? <Pill tone="brass">轮到你出牌</Pill> : null}
        </div>
        <Fan
          testId="skat-hand"
          cards={myHand}
          size="lg"
          onPick={onCard}
          selected={picked}
          legal={legal}
          glow={hint?.card ? [hint.card] : hint?.cards ?? []}
        />
      </div>

      <div data-testid="skat-actions" {...stylex.props(styles.actions)}>
        {refusal ? <Panel tone="bad"><p {...stylex.props(styles.note)}><Rich text={refusal} /></p></Panel> : null}
        {hint ? <Panel tone="tip"><p {...stylex.props(styles.note)}>💡 <Rich text={hint.text} /></p></Panel> : null}
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
          onBidHint={() => {
            const a = bidAdvice(game.hands[ME])
            setHint({
              text: a.contract
                ? `这手牌可以考虑打 **${contractName(a.contract)}**，按现在的牌算值 **${a.limit}**——最多叫到这里，再高就「过」。`
                : '这手牌不够强，建议「过」，安心当防守方。',
            })
          }}
          onDiscardHint={() => {
            const plan = chooseDeclaration(game.hands[ME], game.bid)
            setHint({ cards: plan.discard, text: `建议弃 **${plan.discard.map(cardLabel).join(' 和 ')}**，然后打 **${contractName(plan.declaration.contract)}**。` })
          }}
          onPlayHint={showPlayHint}
          onNewGame={newGame}
        />
      </div>
    </div>
  )
}

function SeatBadge({ seat, game, active, said, score }: { seat: Seat; game: Game; active: boolean; said: string | null; score: number }) {
  const role = ROLE_NAME[roleOf(seat, game.dealer)]
  const isDeclarer = game.declarer === seat
  // An Ouvert declarer plays with the hand face up on the table.
  const open = isDeclarer && game.declaration?.ouvert && (game.phase === 'play' || game.phase === 'trickEnd')
  return (
    <div data-testid={`skat-seat-${seat}`} {...stylex.props(styles.seat, active && styles.seatActive)}>
      <div {...stylex.props(styles.seatHead)}>
        <span {...stylex.props(styles.face)}>{FACES[seat]}</span>
        <div {...stylex.props(styles.seatText)}>
          <span {...stylex.props(styles.seatName)}>{NAMES[seat]}</span>
          <span {...stylex.props(styles.seatMeta)}>{role}{isDeclarer ? ' · 庄家' : ''} · {score} 分</span>
        </div>
        {said ? <span {...stylex.props(styles.bubble)}>{said}</span> : null}
      </div>
      <div {...stylex.props(styles.backs)}>
        {open
          ? sortHand(game.hands[seat], game.declaration!.contract).map((c) => <div key={cardId(c)} {...stylex.props(styles.backSlot)}><PlayingCard card={c} size="xs" /></div>)
          : game.hands[seat].map((c, i) => <div key={i} {...stylex.props(styles.backSlot)}><PlayingCard card={c} faceDown size="xs" /></div>)}
      </div>
    </div>
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
  onDiscardHint: () => void
  onPlayHint: () => void
  onNewGame: () => void
}

function Actions(p: ActionsProps) {
  const { game } = p
  const who = actor(game)

  if (game.phase === 'passedIn') {
    return (
      <Row>
        <Say>三个人都「过」了，这一局作废。</Say>
        <Btn testId="skat-new-game" onClick={p.onNewGame}>重新发牌</Btn>
      </Row>
    )
  }

  if (game.phase === 'done' && game.result && game.declarer !== null) {
    return <Result game={game} onNewGame={p.onNewGame} />
  }

  if (who !== ME) {
    const name = who === null ? '' : NAMES[who]
    const doing = game.phase === 'bidding' ? '在考虑叫牌' : game.phase === 'play' ? '在出牌' : game.phase === 'trickEnd' ? '' : '在看底牌、定约'
    return <Row><Say>{game.phase === 'trickEnd' ? '收墩……' : `${name}${doing}……`}</Say></Row>
  }

  if (game.phase === 'bidding') {
    const b = game.bidding
    if (b.awaiting === 'forehandAlone') {
      return (
        <Row>
          <Say>另外两人都「过」了。你是前家，可以用 18 接下这一局，也可以让它作废。</Say>
          <Btn testId="skat-bid" onClick={() => p.onBid('bid')}>18，我来打</Btn>
          <Btn testId="skat-pass" tone="quiet" onClick={() => p.onBid('pass')}>过</Btn>
          <Btn tone="felt" size="sm" onClick={p.onBidHint}>💡 我能叫多高？</Btn>
        </Row>
      )
    }
    if (b.awaiting === 'speaker') {
      const value = nextBid(b.value)
      return (
        <Row>
          <Say>轮到你向{NAMES[b.listener]}报数。</Say>
          <Btn testId="skat-bid" onClick={() => p.onBid('bid')}>叫 {value}</Btn>
          <Btn testId="skat-pass" tone="quiet" onClick={() => p.onBid('pass')}>过</Btn>
          <Btn tone="felt" size="sm" onClick={p.onBidHint}>💡 我能叫多高？</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{NAMES[b.speaker]}问你：「{b.value}？」</Say>
        <Btn testId="skat-hold" onClick={() => p.onBid('hold')}>有（我也敢打 {b.value}）</Btn>
        <Btn testId="skat-pass" tone="quiet" onClick={() => p.onBid('pass')}>过</Btn>
        <Btn tone="felt" size="sm" onClick={p.onBidHint}>💡 我能叫多高？</Btn>
      </Row>
    )
  }

  if (game.phase === 'skat') {
    if (!game.pickedUp) {
      return (
        <Row>
          <Say>你以 {game.bid} 当上了庄家！拿底牌，还是不看底牌打 Hand（倍数 +1）？</Say>
          <Btn testId="skat-pickup" onClick={p.onPickUp}>拿起底牌</Btn>
          <Btn testId="skat-hand-game" tone="quiet" onClick={p.onHand}>打 Hand</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>底牌已经在你手里了（共 12 张）。点两张牌弃掉——它们的点数直接算你的。</Say>
        <Btn testId="skat-discard" disabled={p.picked.length !== 2} onClick={p.onDiscard}>弃掉这两张（{p.picked.length}/2）</Btn>
        <Btn tone="felt" size="sm" onClick={p.onDiscardHint}>💡 弃哪两张？</Btn>
      </Row>
    )
  }

  if (game.phase === 'declare') {
    return <DeclarePicker game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} />
  }

  return (
    <Row>
      <Say>{game.trick.length === 0 ? '由你首出，出哪张都行。' : '点一张牌打出去。灰掉的牌现在不能出。'}</Say>
      <Btn testId="skat-hint" tone="felt" size="sm" onClick={p.onPlayHint}>💡 提示</Btn>
    </Row>
  )
}

const CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

function DeclarePicker({ game, draft, setDraft, onDeclare }: { game: Game; draft: Declaration | null; setDraft: (d: Declaration | null) => void; onDeclare: (d: Declaration) => void }) {
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
      <Say>宣布定约。你叫到了 <b>{game.bid}</b>，所以这一局的分值不能低于 {game.bid}。</Say>
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
              {...stylex.props(styles.contractBtn, chosen && styles.contractChosen, v < game.bid && styles.contractShort)}
            >
              <span {...stylex.props(styles.contractName)}><Rich text={contractName(c)} /></span>
              <span {...stylex.props(styles.contractValue)}>值 {v}{v < game.bid ? ' · 不够' : ''}</span>
            </button>
          )
        })}
      </div>
      {draft ? (
        <div {...stylex.props(styles.toggles)}>
          {draft.contract.kind === 'null' ? (
            <Toggle on={draft.ouvert} onClick={() => setDraft(make(draft.contract, { ouvert: !draft.ouvert }))}>Ouvert（摊开手牌打）</Toggle>
          ) : isHand ? (
            <>
              <Toggle on={draft.schneiderAnnounced} onClick={() => setDraft(make(draft.contract, { schneiderAnnounced: !draft.schneiderAnnounced }))}>宣告 Schneider</Toggle>
              <Toggle on={draft.schwarzAnnounced} onClick={() => setDraft(make(draft.contract, { schwarzAnnounced: !draft.schwarzAnnounced }))}>宣告 Schwarz</Toggle>
              <Toggle on={draft.ouvert} onClick={() => setDraft(make(draft.contract, { ouvert: !draft.ouvert }))}>Ouvert</Toggle>
            </>
          ) : null}
        </div>
      ) : null}
      {draft && value !== null ? (
        <Panel tone={value >= game.bid ? 'good' : 'bad'}>
          <p {...stylex.props(styles.note)}>
            {value >= game.bid
              ? `${contractName(draft.contract)}${draft.hand ? ' Hand' : ''}：赢了值 ${value}，盖得住叫分 ${game.bid}。`
              : `${contractName(draft.contract)} 只值 ${value}，低于你的叫分 ${game.bid}——这是超叫，打成什么样都判负。换一个定约。`}
            {isHand && draft.contract.kind !== 'null' ? ' （Hand：底牌里的 J 还可能改变 Matador。）' : ''}
          </p>
        </Panel>
      ) : null}
      <Row>
        <Btn testId="skat-declare" disabled={!draft} onClick={() => draft && onDeclare(draft)}>就打这个，开始！</Btn>
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
    ? `Null${d.hand ? ' Hand' : ''}${d.ouvert ? ' Ouvert' : ''} 固定分值 ${r.value}`
    : `${r.parts.map((p, i) => (i === 0 ? p.label : `${p.label} 1`)).join(' + ')} → 倍数 ${r.multiplier}；${contractName(d.contract)} 基值 ${r.base} × ${r.multiplier} = ${r.base * r.multiplier}`
  return (
    <div ref={panel} data-testid="skat-result" data-human-won={String(humanWon)} {...stylex.props(styles.declare)}>
      <Panel tone={humanWon ? 'good' : 'bad'}>
        <div {...stylex.props(styles.resultBody)}>
          <h3 {...stylex.props(styles.resultTitle)}>{humanWon ? '🎉 你这边赢了！' : '这一局输了'}</h3>
          <p {...stylex.props(styles.note)}>
            {declarer === ME ? '你当庄家' : `${NAMES[declarer]}当庄家`}，打 <Rich text={`**${contractName(d.contract)}**`} />，叫分 {game.bid}。{r.reason}。
          </p>
          {isNull ? null : (
            <p data-testid="skat-result-points" {...stylex.props(styles.note)}>
              牌点：庄家 <b>{r.declarerPoints}</b>（含底牌）· 防守方 <b>{r.defenderPoints}</b>
            </p>
          )}
          <p data-testid="skat-result-formula" {...stylex.props(styles.note)}>算式：{formula}</p>
          <p {...stylex.props(styles.note)}>
            {NAMES[declarer]}记 <b>{r.score > 0 ? `+${r.score}` : r.score}</b> 分{r.won ? '' : '（输了按两倍扣）'}。
          </p>
          <div {...stylex.props(styles.resultSkat)}>
            <span {...stylex.props(styles.inkLabel)}>底牌里是：</span>
            {game.skat.map((c) => <PlayingCard key={cardId(c)} card={c} size="xs" />)}
          </div>
        </div>
      </Panel>
      <Row>
        <Btn testId="skat-new-game" onClick={onNewGame}>再来一局</Btn>
      </Row>
    </div>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} {...stylex.props(styles.toggle, on && styles.toggleOn)}>
      {on ? '☑' : '☐'} {children}
    </button>
  )
}

const Row = ({ children }: { children: ReactNode }) => <div {...stylex.props(styles.row)}>{children}</div>
const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(styles.say)}>{children}</p>

// Where a card flies in from: each player's side of the table.
const FROM: Record<Seat, { x: number; y: number }> = { 0: { x: 0, y: 90 }, 1: { x: -120, y: -40 }, 2: { x: 120, y: -40 } }

const styles = stylex.create({
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: { default: 16, '@media (max-width: 480px)': 10 },
    borderRadius: 24,
    backgroundColor: skat.felt,
    backgroundImage: `radial-gradient(ellipse at 50% 35%, ${skat.feltLight} 0%, ${skat.felt} 55%, ${skat.feltDeep} 100%)`,
    boxShadow: `inset 0 0 0 3px ${skat.feltDeep}, 0 10px 30px ${skat.shadow}`,
    color: skat.white,
    overflow: 'hidden',
  },
  opponents: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  seat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    borderRadius: 14,
    backgroundColor: skat.feltDeep,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'transparent',
    minWidth: 0,
  },
  seatActive: { borderColor: skat.brass },
  seatHead: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  face: { fontSize: 26, lineHeight: 1 },
  seatText: { display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 },
  seatName: { fontWeight: 800, fontSize: 15 },
  seatMeta: { fontSize: 12, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bubble: {
    backgroundColor: skat.paper,
    color: skat.ink,
    fontWeight: 800,
    fontSize: 14,
    paddingBlock: 4,
    paddingInline: 10,
    borderRadius: 12,
    whiteSpace: 'nowrap',
  },
  backs: { display: 'flex', paddingRight: 22, minHeight: 48 },
  backSlot: { flexBasis: 22, flexShrink: 1, minWidth: 8 },
  centre: { position: 'relative', height: { default: 230, '@media (max-width: 480px)': 190 } },
  skatPile: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  skatCards: { display: 'flex', gap: 6 },
  feltLabel: { fontSize: 12, fontWeight: 700, opacity: 0.9 },
  inkLabel: { fontSize: 13, fontWeight: 700, color: skat.inkSoft },
  trickCard: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  trickNote: { position: 'absolute', left: 0, right: 0, top: 4, display: 'flex', justifyContent: 'center' },
  strip: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  mine: { display: 'flex', flexDirection: 'column', gap: 2 },
  mineHead: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: { default: 14, '@media (max-width: 480px)': 12 },
    borderRadius: 18,
    backgroundColor: skat.paper,
    color: skat.ink,
  },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  say: { margin: 0, fontSize: 15, lineHeight: 1.5, flexBasis: '100%', color: skat.ink },
  // Colour is stated on every heading and paragraph in the course: the app theme colours `h*` and
  // `p` itself, and in dark mode that colour is a light one — unreadable on this paper.
  note: { margin: 0, fontSize: 14, lineHeight: 1.6, color: skat.ink },
  declare: { display: 'flex', flexDirection: 'column', gap: 10 },
  contractGrid: { display: 'grid', gridTemplateColumns: { default: 'repeat(6, 1fr)', '@media (max-width: 600px)': 'repeat(3, 1fr)' }, gap: 8 },
  contractBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingBlock: 10,
    paddingInline: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  contractChosen: { borderColor: skat.brassDeep, backgroundColor: skat.brassSoft },
  contractShort: { opacity: 0.6 },
  contractName: { fontSize: 16, fontWeight: 800 },
  contractValue: { fontSize: 12, color: skat.inkSoft },
  toggles: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  toggle: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    borderRadius: 999,
    paddingBlock: 6,
    paddingInline: 12,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleOn: { backgroundColor: skat.brassSoft, borderColor: skat.brassDeep },
  resultBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  resultTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: skat.ink },
  resultSkat: { display: 'flex', alignItems: 'center', gap: 6 },
})

// The three places a played card lands: in front of whoever played it.
const positions = stylex.create({
  0: { left: '50%', bottom: 0, marginLeft: { default: -36, '@media (max-width: 480px)': -29 } },
  1: { left: { default: '22%', '@media (max-width: 480px)': '10%' }, top: 22 },
  2: { right: { default: '22%', '@media (max-width: 480px)': '10%' }, top: 22 },
})
