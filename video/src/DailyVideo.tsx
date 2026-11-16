import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { PlayingCard } from '~/components/skat/playing-card'
import type { Card } from '~/lib/skat/cards'
import { timeline, type Slot } from './timeline'
import { FPS, THINK, TRICK, type Day, type Plan } from './types'

// SkatGo's daily videos (SKATGO-202): the site's felt, logo and cards, a voice, and the words it says under it.
// The colours are the site's (app/src/theme/color.stylex.ts); the cards are the site's own `PlayingCard`.

const C = { feltInner: '#085435', feltOuter: '#053320', navy: '#022657', go: '#00A336', gold: '#EDA010', white: '#FFFFFF', page: '#F2F4F7' }
const FONT = 'Red Hat Display'

/** What the video writes on screen, in its language (the spoken lines come from scripts/plan.ts). */
const UI = {
  de: { quiz: 'Deal des Tages', answer: 'Auflösung', quizTitle: 'Jetzt du!', answerTitle: 'So geht’s richtig', bidTo: 'Gereizt bis', plays: 'spielt', discarded: 'gedrückt', yourGame: 'Dein Spiel', won: 'Gewonnen', points: 'Punkte', lost: 'Verloren', defence: 'Verteidigung gewinnt', playNow: 'Jetzt mitspielen', newDeal: 'Neuer Deal heute' },
  en: { quiz: 'Deal of the Day', answer: 'The answer', quizTitle: 'Your turn!', answerTitle: 'How it’s done', bidTo: 'Bid to', plays: 'plays', discarded: 'discarded', yourGame: 'Your game', won: 'Won', points: 'points', lost: 'Lost', defence: 'Defence wins', playNow: 'Play now', newDeal: 'New deal today' },
}

/** The logo on the white disc it turns on while a table loads (SKATGO-93's `loaderGlow`: white to two thirds, fading
 *  into the felt at the rim), so it stands out on the felt (the human: 「logo必须有个白色的渐变背景」). */
function Logo({ size }: { size: number }) {
  const disc = size * 1.5
  return (
    <div style={{ width: disc, height: disc, margin: -(disc - size) / 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle closest-side, ${C.white} 0%, ${C.white} 66%, transparent 100%)` }}>
      <Img src={staticFile('site/logo-mark.png')} style={{ width: size, height: size }} />
    </div>
  )
}

// The card faces' pictures resolve under Remotion's static base (remotion.config.ts).
;(globalThis as { __skatgoBase?: string }).__skatgoBase = staticFile('site/cards').replace(/\/cards$/, '')

function useFonts() {
  const [handle] = useState(() => delayRender('fonts'))
  useEffect(() => {
    const faces = [
      new FontFace(FONT, `url(${staticFile('site/fonts/RedHatDisplay-Black.ttf')})`, { weight: '900' }),
      new FontFace(FONT, `url(${staticFile('site/fonts/RedHatDisplay-Bold.ttf')})`, { weight: '700' }),
      new FontFace(FONT, `url(${staticFile('site/fonts/RedHatDisplay-Medium.ttf')})`, { weight: '500' }),
    ]
    Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l)))).then(() => continueRender(handle))
  }, [handle])
}

const text = (size: number, weight = 900, color = C.white): CSSProperties => ({ fontFamily: FONT, fontSize: size, fontWeight: weight, color, lineHeight: 1.15, margin: 0 })

function Header({ plan }: { plan: Plan }) {
  return (
    <div style={{ position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <Logo size={110} />
        <p style={text(84)}>SkatGo</p>
      </div>
      <div style={{ ...text(40, 700, C.navy), background: C.gold, borderRadius: 999, padding: '12px 34px' }}>
        {plan.kind === 'quiz' ? UI[plan.lang].quiz : UI[plan.lang].answer} · {plan.date}
      </div>
    </div>
  )
}

/** A card at a given width, popping in from `at`. */
function Pop({ at, children, style }: { at: number; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const s = spring({ frame: frame - at, fps: FPS, config: { damping: 14 } })
  return <div style={{ ...style, transform: `${style?.transform ?? ''} scale(${s})`, opacity: s }}>{children}</div>
}

function CardAt({ card, width, glow }: { card: Card; width: number; glow?: boolean }) {
  return (
    <div style={{ width, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))' }}>
      <PlayingCard card={card} size="fill" glow={glow} />
    </div>
  )
}

/** The player's ten cards in two rows of five. */
function Hand({ hand, from, top, width = 176 }: { hand: Card[]; from: number; top: number; width?: number }) {
  const rows = [hand.slice(0, 5), hand.slice(5)]
  return (
    <div style={{ position: 'absolute', top, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: 'flex', gap: 14 }}>
          {row.map((c, i) => (
            <Pop key={i} at={from + (r * 5 + i) * 3}>
              <CardAt card={c} width={width} />
            </Pop>
          ))}
        </div>
      ))}
    </div>
  )
}

function Panel({ children, top, at }: { children: ReactNode; top: number; at: number }) {
  return (
    <Pop at={at} style={{ position: 'absolute', top, left: 70, right: 70, background: C.white, borderRadius: 36, padding: '44px 48px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
      {children}
    </Pop>
  )
}

/** The words of the line being said, each lit as the voice reaches it (spread over the line by its letters). */
function Caption({ slot }: { slot: Slot | undefined }) {
  const frame = useCurrentFrame()
  if (!slot) return null
  const spoken = slot.frames ?? slot.length
  const words = slot.text.split(' ')
  const total = slot.text.length
  let before = 0
  const lit = (frame - slot.from) / spoken
  return (
    <div style={{ position: 'absolute', top: 1330, left: 70, right: 70, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px', background: 'rgba(0,0,0,0.45)', borderRadius: 28, padding: '26px 30px' }}>
      {words.map((w, i) => {
        const at = before / total
        before += w.length + 1
        return (
          <span key={i} style={{ ...text(56, 900, lit >= at ? C.white : 'rgba(255,255,255,0.4)') }}>
            {w}
          </span>
        )
      })}
    </div>
  )
}

function Countdown({ from }: { from: number }) {
  const frame = useCurrentFrame()
  const left = Math.ceil((THINK - (frame - from)) / FPS)
  if (frame < from || left <= 0) return null
  return <p style={{ ...text(120, 900, C.go) }}>{left}</p>
}

function Tricks({ plan, from }: { plan: Plan; from: number }) {
  const tricks = plan.tricks ?? []
  return (
    <div style={{ position: 'absolute', top: 360, left: 60, right: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 40px' }}>
      {tricks.map((t, i) => (
        <Pop key={i} at={from + i * TRICK}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ ...text(36, 700), width: 44, textAlign: 'right' }}>{i + 1}</p>
            {t.cards.map((p, j) => (
              <CardAt key={j} card={p.card} width={104} glow={p.seat === t.winner} />
            ))}
          </div>
        </Pop>
      ))}
    </div>
  )
}

export function DailyVideo(day: Day) {
  useFonts()
  const frame = useCurrentFrame()
  const ui = UI[day.lang]
  const { slots } = timeline(day.segments, day.yesterday.tricks?.length ?? 0)
  const now = [...slots].reverse().find((s) => frame >= s.from)
  // Yesterday's deal first, then today's: each part shows its own plan.
  const part = now?.part ?? 'answer'
  const plan: Plan = part === 'answer' ? day.yesterday : day.today
  const mine = slots.filter((s) => s.part === part)
  const at = (scene: string) => mine.find((s) => s.scene === scene)
  const scene = now?.scene ?? 'intro'
  const past = (s: string) => (at(s) ? frame >= at(s)!.from : false)
  const fadeIn = (from: number) => interpolate(frame, [from, from + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const hand = at('hand')
  const showHand = hand && past('hand') && !['play', 'result', 'cta'].includes(scene)
  const q = at('question')
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${C.feltInner} 0%, ${C.feltOuter} 100%)` }}>
      {slots.map((s) => (s.audio ? <Sequence key={s.id} from={s.from}><Audio src={staticFile(s.audio)} /></Sequence> : null))}
      <Header plan={plan} />
      {scene === 'intro' || scene === 'turn' ? (
        <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', opacity: fadeIn(now?.from ?? 0) }}>
          <p style={text(plan.kind === 'quiz' ? 120 : 104)}>{plan.kind === 'quiz' ? ui.quizTitle : ui.answerTitle}</p>
        </div>
      ) : null}
      {showHand ? <Hand hand={plan.hand} from={hand!.from} top={scene === 'hand' ? 520 : 440} /> : null}
      {plan.kind === 'quiz' && q && past('question') && scene !== 'cta' ? (
        <Panel top={1000} at={q.from}>
          <p style={text(66, 900, C.navy)}>{plan.question?.text}</p>
          <Countdown from={q.from + (q.frames ?? 0)} />
        </Panel>
      ) : null}
      {plan.kind === 'answer' && (scene === 'auction' || scene === 'discard') && plan.contract ? (
        <Panel top={1000} at={at('auction')!.from}>
          <p style={text(40, 700, C.navy)}>{plan.mine ? `${ui.bidTo} ${plan.bid}` : `${plan.declarer} ${ui.plays}`}</p>
          <p style={text(76, 900, C.navy)}>{plan.contract}</p>
          {scene === 'discard' && plan.discard?.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <p style={text(36, 700, C.navy)}>{ui.discarded}</p>
              {plan.discard.map((c, i) => <CardAt key={i} card={c} width={96} />)}
            </div>
          ) : null}
        </Panel>
      ) : null}
      {plan.kind === 'answer' && scene === 'play' ? <Tricks plan={plan} from={at('play')!.from} /> : null}
      {plan.kind === 'answer' && scene === 'result' && plan.points ? (
        <Panel top={600} at={at('result')!.from}>
          <p style={text(44, 700, C.navy)}>{plan.mine ? ui.yourGame : `${plan.declarer} · ${plan.contract}`}</p>
          <p style={text(130, 900, plan.mine ? (plan.won ? C.go : '#E52F1D') : plan.won ? '#E52F1D' : C.go)}>
            {plan.points.declarer} : {plan.points.defenders}
          </p>
          <p style={text(44, 700, C.navy)}>{plan.mine ? (plan.won ? `${ui.won} · ${plan.points.value} ${ui.points}` : ui.lost) : plan.won ? ui.won : ui.defence}</p>
        </Panel>
      ) : null}
      {scene === 'cta' ? (
        <div style={{ position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: fadeIn(now!.from) }}>
          <Logo size={260} />
          <p style={text(104)}>skatgo.com</p>
          <div style={{ ...text(52, 900), background: C.go, borderRadius: 999, padding: '22px 60px' }}>{plan.kind === 'quiz' ? ui.playNow : ui.newDeal}</div>
        </div>
      ) : null}
      {/* The question's panel says the line itself; the caption would sit under its countdown. */}
      {scene === 'question' ? null : <Caption slot={now} />}
    </AbsoluteFill>
  )
}
