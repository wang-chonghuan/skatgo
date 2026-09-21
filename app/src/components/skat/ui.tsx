import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { m } from '~/paraglide/messages'
import { skat } from '../../theme/skat.stylex'

// The course's own small kit. It deliberately does not reach for Astryx: the course has a look of
// its own (PARROT-42), and an Astryx control follows the app's light/dark mode while this palette
// is fixed — a matcha button in dark mode on cream paper would be unreadable.

const RED_SUITS = /([♥♦])/

/** Inline text with the course's two conventions: **bold**, and red suit symbols coloured red. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) => {
        const pieces = part.split(RED_SUITS).map((piece, j) =>
          RED_SUITS.test(piece) ? (
            <span key={j} {...stylex.props(styles.redSuit)}>{piece}</span>
          ) : (
            piece
          ),
        )
        return i % 2 === 1 ? <strong key={i} {...stylex.props(styles.strong)}>{pieces}</strong> : <span key={i}>{pieces}</span>
      })}
    </>
  )
}

type BtnProps = {
  children: ReactNode
  onClick?: () => void
  tone?: 'primary' | 'quiet' | 'felt' | 'danger'
  size?: 'md' | 'lg' | 'sm'
  disabled?: boolean
  testId?: string
  grow?: boolean
}

export function Btn({ children, onClick, tone = 'primary', size = 'md', disabled, testId, grow }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      {...stylex.props(styles.btn, tones[tone], btnSizes[size], grow && styles.grow, disabled && styles.btnDisabled)}
    >
      {children}
    </button>
  )
}

/** The same look for a router <Link>: navigation is a link, an action is a button. */
export function linkLook(tone: NonNullable<BtnProps['tone']> = 'primary', size: NonNullable<BtnProps['size']> = 'md') {
  return stylex.props(styles.btn, tones[tone], btnSizes[size], styles.link)
}

export function Panel({ children, tone = 'paper', pad = true }: { children: ReactNode; tone?: 'paper' | 'tip' | 'good' | 'bad'; pad?: boolean }) {
  return <div {...stylex.props(styles.panel, panelTones[tone], pad && styles.panelPad)}>{children}</div>
}

export function Pill({ children, tone = 'ink' }: { children: ReactNode; tone?: 'ink' | 'brass' | 'good' | 'felt' }) {
  return <span {...stylex.props(styles.pill, pillTones[tone])}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} {...stylex.props(styles.track)}>
      <div {...stylex.props(styles.fill, dynamic.width(`${pct}%`))} />
    </div>
  )
}

export function Stars({ n }: { n: number }) {
  return (
    <span aria-label={m.stars({ n })} {...stylex.props(styles.stars)}>
      {[1, 2, 3].map((i) => (
        <span key={i} {...stylex.props(i <= n ? styles.starOn : styles.starOff)}>★</span>
      ))}
    </span>
  )
}

const dynamic = stylex.create({
  width: (w: string) => ({ width: w }),
})

const styles = stylex.create({
  redSuit: { color: skat.red },
  strong: { fontWeight: 700, color: skat.ink },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0,
    borderRadius: 999,
    fontFamily: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transitionProperty: 'transform, box-shadow, background-color',
    transitionDuration: '120ms',
    transform: { default: 'translateY(0)', ':active': 'translateY(2px)' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 3,
    outlineColor: skat.brass,
    outlineOffset: 2,
  },
  grow: { flexGrow: 1 },
  link: { textDecoration: 'none' },
  btnDisabled: { opacity: 0.45, cursor: 'not-allowed', boxShadow: 'none' },
  panel: { borderRadius: 18, borderWidth: 1, borderStyle: 'solid' },
  panelPad: { padding: { default: 20, '@media (max-width: 480px)': 16 } },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    paddingBlock: 3,
    paddingInline: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
  track: { height: 10, borderRadius: 999, backgroundColor: skat.paperEdge, overflow: 'hidden' },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: skat.brass,
    transitionProperty: 'width',
    transitionDuration: '400ms',
    transitionTimingFunction: 'ease-out',
  },
  stars: { display: 'inline-flex', gap: 1, fontSize: 16, lineHeight: 1 },
  starOn: { color: skat.brass },
  starOff: { color: skat.paperEdge },
})

const tones = stylex.create({
  primary: { backgroundColor: skat.brass, color: skat.ink, boxShadow: `0 3px 0 ${skat.brassDeep}` },
  quiet: { backgroundColor: skat.paperDeep, color: skat.ink, boxShadow: `0 3px 0 ${skat.paperEdge}` },
  felt: { backgroundColor: skat.feltLight, color: skat.white, boxShadow: `0 3px 0 ${skat.feltDeep}` },
  danger: { backgroundColor: skat.badSoft, color: skat.bad, boxShadow: `0 3px 0 ${skat.paperEdge}` },
})

const btnSizes = stylex.create({
  sm: { fontSize: 13, paddingBlock: 6, paddingInline: 12 },
  md: { fontSize: 15, paddingBlock: 10, paddingInline: 18 },
  lg: { fontSize: 17, paddingBlock: 14, paddingInline: 26 },
})

const panelTones = stylex.create({
  paper: { backgroundColor: skat.paper, borderColor: skat.paperEdge, color: skat.ink },
  tip: { backgroundColor: skat.brassSoft, borderColor: skat.brass, color: skat.ink },
  good: { backgroundColor: skat.goodSoft, borderColor: skat.good, color: skat.ink },
  bad: { backgroundColor: skat.badSoft, borderColor: skat.bad, color: skat.ink },
})

const pillTones = stylex.create({
  ink: { backgroundColor: skat.paperDeep, color: skat.inkSoft },
  brass: { backgroundColor: skat.brass, color: skat.ink },
  good: { backgroundColor: skat.goodSoft, color: skat.good },
  felt: { backgroundColor: skat.feltDeep, color: skat.white },
})
