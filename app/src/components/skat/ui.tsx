import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { move, timing } from '../../theme/effects.stylex'
import { elev, fill } from '../../theme/elevation.stylex'
import { border, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { suit } from '../../theme/suits.stylex'
import { typography } from '../../theme/type'

// The product's own small kit, in the lobby design (SKATGO-26, reference.md). It does not reach for
// Astryx components: their colours follow the app theme's light/dark mode, while this palette is fixed.
//
// Buttons come in three shapes, one per place the design puts them:
//   pill    — the app's buttons (40 tall, fully round), e.g. the top bar's green action;
//   block   — the card table's buttons (rounded rectangle, radius 12), full width in the side panel;
//   landing — the public site's buttons (radius 14, heavier type).
// Every coloured button casts a shadow in its own colour, as the design does.

const SUIT_GLYPHS = /([♣♠♥♦])/

/** Inline text with the course's two conventions: **bold**, and each suit symbol in its colour from
 *  the chosen scheme (SKATGO-27). */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) => {
        const pieces = part.split(SUIT_GLYPHS).map((piece, j) =>
          SUIT_GLYPHS.test(piece) ? (
            <span key={j} {...stylex.props(suitText[piece as Glyph])}>{piece}</span>
          ) : (
            piece
          ),
        )
        return i % 2 === 1 ? <strong key={i} {...stylex.props(typography.emphasis, styles.strong)}>{pieces}</strong> : <span key={i}>{pieces}</span>
      })}
    </>
  )
}

type Tone = 'go' | 'quiet' | 'info' | 'stop' | 'slate'
type Shape = 'pill' | 'block' | 'landing'
type Size = 'sm' | 'md' | 'lg'

type BtnProps = {
  children: ReactNode
  onClick?: () => void
  tone?: Tone
  shape?: Shape
  size?: Size
  disabled?: boolean
  testId?: string
  grow?: boolean
}

export function Btn({ children, onClick, tone = 'go', shape = 'pill', size = 'md', disabled, testId, grow }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      {...stylex.props(btnType(shape, size), styles.btn, shapes[shape], sizes[size], tones[tone], shape === 'landing' && landingTones[tone], grow && styles.grow, disabled && styles.btnDisabled)}
    >
      {children}
    </button>
  )
}

/** The same look for a router <Link>: navigation is a link, an action is a button. */
export function linkLook(tone: Tone = 'go', size: Size = 'md', shape: Shape = 'pill') {
  return stylex.props(btnType(shape, size), styles.btn, shapes[shape], sizes[size], tones[tone], shape === 'landing' && landingTones[tone], styles.link)
}

/** A one-line text field — a name, as the daily leaderboard and a private table ask for it. Enter
 *  submits. */
export function TextField({ id, testId, value, onChange, onEnter, invalid, autoComplete }: {
  id: string
  testId?: string
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  invalid?: boolean
  autoComplete?: string
}) {
  return (
    <input
      id={id}
      data-testid={testId}
      type="text"
      autoComplete={autoComplete}
      value={value}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
      }}
      {...stylex.props(typography.appText, typography.control, styles.input)}
    />
  )
}

/** A white card on the grey page (the design's option card), or a judged / tip panel. */
export function Panel({ children, tone = 'card', pad = true }: { children: ReactNode; tone?: 'card' | 'tip' | 'good' | 'bad'; pad?: boolean }) {
  return <div {...stylex.props(styles.panel, panelTones[tone], pad && styles.panelPad)}>{children}</div>
}

/** A tip: the tip panel around the words. */
export function Tip({ children }: { children: ReactNode }) {
  return <Panel tone="tip">{children}</Panel>
}

/** A short fact, never an action: white on the page, dark on the felt, amber for whose turn it is. */
export function Pill({ children, tone = 'quiet' }: { children: ReactNode; tone?: 'quiet' | 'go' | 'good' | 'dark' | 'amber' }) {
  return <span {...stylex.props(typography.appBtn, styles.pill, pillTones[tone])}>{children}</span>
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

function btnType(shape: Shape, size: Size) {
  if (shape === 'landing') return size === 'lg' ? typography.landingCta : typography.landingBtn
  return shape === 'block' ? typography.appBtnStrong : typography.appBtn
}

type Glyph = '♣' | '♠' | '♥' | '♦'

/** A suit symbol in text, in the chosen scheme's text colour. */
export const suitText = stylex.create({
  '♣': { color: suit.textClubs },
  '♠': { color: suit.textSpades },
  '♥': { color: suit.textHearts },
  '♦': { color: suit.textDiamonds },
})

const dynamic = stylex.create({
  width: (w: string) => ({ width: w }),
})

const styles = stylex.create({
  input: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: dims.control,
    boxSizing: 'border-box',
    paddingBlock: space.x10,
    paddingInline: space.x12,
    color: color.text,
    backgroundColor: color.surface,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: { default: color.hairline, ':focus': color.info },
    borderRadius: radii.panel,
    outlineStyle: 'none',
    boxShadow: { default: 'none', ':focus': elev.focus },
  },
  strong: { color: color.navy },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x8,
    boxSizing: 'border-box',
    borderWidth: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transitionProperty: 'transform, box-shadow, background-color, filter',
    transitionDuration: { default: timing.press, [bp.reducedMotion]: timing.instant },
    transform: { default: move.rest, ':active': move.press },
    filter: { default: 'none', ':hover': fill.hoverBright },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  grow: { flexGrow: 1 },
  link: { textDecoration: 'none' },
  btnDisabled: { opacity: opacity.disabled, cursor: 'not-allowed', boxShadow: 'none', filter: 'none' },
  panel: { borderRadius: radii.option, borderWidth: border.hair, borderStyle: 'solid' },
  panelPad: { padding: { default: space.x24, [bp.phone]: space.x16 } },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x6,
    boxSizing: 'border-box',
    minHeight: dims.control,
    paddingInline: space.x16,
    borderRadius: radii.pill,
    whiteSpace: 'nowrap',
  },
  track: { height: space.x10, borderRadius: radii.round, backgroundColor: color.hairline, overflow: 'hidden' },
  fill: {
    height: '100%',
    borderRadius: radii.round,
    backgroundColor: color.go,
    transitionProperty: 'width',
    transitionDuration: { default: timing.progress, [bp.reducedMotion]: timing.instant },
    transitionTimingFunction: timing.easeOut,
  },
  stars: { display: 'inline-flex', gap: space.x2 },
  starOn: { color: color.amber },
  starOff: { color: color.hairline },
})

const shapes = stylex.create({
  pill: { borderRadius: radii.pill },
  block: { borderRadius: radii.panel },
  landing: { borderRadius: radii.landingBtn },
})

// Heights: the app's controls are 40 tall (md); sm and lg are derived around it.
const sizes = stylex.create({
  sm: { minHeight: space.x32, paddingInline: space.x12 },
  md: { minHeight: dims.control, paddingInline: space.x16 },
  lg: { minHeight: space.x48, paddingInline: space.x24 },
})

const tones = stylex.create({
  go: { backgroundColor: color.go, color: color.onColor, boxShadow: elev.btnGo },
  quiet: { backgroundColor: color.surface, color: color.navy, boxShadow: elev.option },
  info: { backgroundColor: color.info, color: color.onColor, boxShadow: elev.btnInfo },
  stop: { backgroundColor: color.stop, color: color.onColor, boxShadow: elev.btnStop },
  slate: { backgroundColor: color.slateDeep, color: color.onColor, boxShadow: elev.btnSlate },
})

// The public site's green is its own (reference.md: rgb(0,168,120)).
const landingTones = stylex.create({
  go: { backgroundColor: color.goLanding, boxShadow: elev.btnGoLanding },
  quiet: {},
  info: {},
  stop: {},
  slate: {},
})

const panelTones = stylex.create({
  card: { backgroundColor: color.surface, borderColor: 'transparent', color: color.text, boxShadow: elev.option },
  tip: { backgroundColor: color.surface, borderColor: color.amber, color: color.text, boxShadow: elev.option },
  good: { backgroundColor: color.goodSoft, borderColor: color.good, color: color.text },
  bad: { backgroundColor: color.badSoft, borderColor: color.bad, color: color.text },
})

const pillTones = stylex.create({
  quiet: { backgroundColor: color.surface, color: color.navy },
  go: { backgroundColor: color.go, color: color.onColor },
  good: { backgroundColor: color.goodSoft, color: color.good },
  dark: { backgroundColor: color.plate, color: color.onColor },
  amber: { backgroundColor: color.amber, color: color.plate },
})
