import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { move, shadow, timing } from '../../theme/effects.stylex'
import { border, opacity, radius, size, space } from '../../theme/scale.stylex'
import { skat } from '../../theme/skat.stylex'
import { typography } from '../../theme/type'

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
        return i % 2 === 1 ? <strong key={i} {...stylex.props(typography.emphasis, styles.strong)}>{pieces}</strong> : <span key={i}>{pieces}</span>
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
      {...stylex.props(btnType[size], styles.btn, tones[tone], btnSizes[size], grow && styles.grow, disabled && styles.btnDisabled)}
    >
      {children}
    </button>
  )
}

/** The same look for a router <Link>: navigation is a link, an action is a button. */
export function linkLook(tone: NonNullable<BtnProps['tone']> = 'primary', size: NonNullable<BtnProps['size']> = 'md') {
  return stylex.props(btnType[size], styles.btn, tones[tone], btnSizes[size], styles.link)
}

export function Panel({ children, tone = 'paper', pad = true }: { children: ReactNode; tone?: 'paper' | 'tip' | 'good' | 'bad'; pad?: boolean }) {
  return <div {...stylex.props(styles.panel, panelTones[tone], pad && styles.panelPad)}>{children}</div>
}

export function Pill({ children, tone = 'ink' }: { children: ReactNode; tone?: 'ink' | 'brass' | 'good' | 'felt' }) {
  return <span {...stylex.props(typography.pill, styles.pill, pillTones[tone])}>{children}</span>
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
    <span aria-label={m.stars({ n })} {...stylex.props(typography.stars, styles.stars)}>
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
  strong: { color: skat.ink },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x8,
    borderWidth: 0,
    borderRadius: radius.round,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transitionProperty: 'transform, box-shadow, background-color',
    transitionDuration: timing.press,
    transform: { default: move.rest, ':active': move.press },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: skat.brass,
    outlineOffset: border.focusOffset,
  },
  grow: { flexGrow: 1 },
  link: { textDecoration: 'none' },
  btnDisabled: { opacity: opacity.disabled, cursor: 'not-allowed', boxShadow: 'none' },
  panel: { borderRadius: radius.panel, borderWidth: border.hair, borderStyle: 'solid' },
  panelPad: { padding: { default: space.x20, [bp.phone]: space.x16 } },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x4,
    paddingBlock: space.x4,
    paddingInline: space.x10,
    borderRadius: radius.round,
    whiteSpace: 'nowrap',
  },
  track: { height: size.progressTrack, borderRadius: radius.round, backgroundColor: skat.paperEdge, overflow: 'hidden' },
  fill: {
    height: '100%',
    borderRadius: radius.round,
    backgroundColor: skat.brass,
    transitionProperty: 'width',
    transitionDuration: timing.progress,
    transitionTimingFunction: timing.easeOut,
  },
  stars: { display: 'inline-flex', gap: space.x2 },
  starOn: { color: skat.brass },
  starOff: { color: skat.paperEdge },
})

const tones = stylex.create({
  primary: { backgroundColor: skat.brass, color: skat.ink, boxShadow: shadow.ledgePrimary },
  quiet: { backgroundColor: skat.paperDeep, color: skat.ink, boxShadow: shadow.ledgeQuiet },
  felt: { backgroundColor: skat.feltLight, color: skat.white, boxShadow: shadow.ledgeFelt },
  danger: { backgroundColor: skat.badSoft, color: skat.bad, boxShadow: shadow.ledgeQuiet },
})

const btnSizes = stylex.create({
  sm: { paddingBlock: space.x6, paddingInline: space.x12 },
  md: { paddingBlock: space.x10, paddingInline: space.x18 },
  lg: { paddingBlock: space.x14, paddingInline: space.x24 },
})

// The typography role that goes with each button size.
const btnType = { sm: typography.controlSm, md: typography.controlMd, lg: typography.controlLg }

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
