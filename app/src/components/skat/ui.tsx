import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { move, timing } from '../../theme/effects.stylex'
import { elev, fill } from '../../theme/elevation.stylex'
import { icon } from '../../theme/constants'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
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

/** Inline text with the course's two conventions: **bold**, and each suit symbol in its colour
 *  (SKATGO-27). */
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

/** Text over several lines — a forum post's text or a comment (SKATGO-118). It starts a few lines tall for what it
 *  holds (SKATGO-119) and grows with what is written (where the browser can; elsewhere it can be dragged taller). */
export function TextArea({ id, testId, value, onChange, size, invalid }: {
  id: string
  testId?: string
  value: string
  onChange: (value: string) => void
  size: 'post' | 'comment'
  invalid?: boolean
}) {
  return (
    <textarea
      id={id}
      data-testid={testId}
      value={value}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
      {...stylex.props(typography.appText, typography.control, styles.input, styles.area, size === 'post' ? styles.areaPost : styles.areaComment)}
    />
  )
}

/** A choice that is on or off, as a pill: the day's tournaments, the board's day, a forum post's section. */
export function Toggle({ pressed, onClick, testId, children }: { pressed: boolean; onClick: () => void; testId: string; children: ReactNode }) {
  return (
    <button type="button" data-testid={testId} aria-pressed={pressed} onClick={onClick} {...stylex.props(typography.toggle, styles.switch, pressed && styles.switchOn)}>
      {children}
    </button>
  )
}

/** The same pill for a router `<Link>` — a view of a page, such as the forum filtered by section. */
export function toggleLook(pressed: boolean) {
  return stylex.props(typography.toggle, styles.switch, styles.switchLink, pressed && styles.switchOn)
}

/** A white card on the grey page (the design's option card), or a judged / tip panel. `fill` makes it as tall as
 *  where it sits, its content a column that may scroll inside (the hero's Elo board, SKATGO-123). */
/**
 * A dialog over the page (the settings' own since SKATGO-66, the kit's since SKATGO-140, the human: 「点开后那个toast不好关……
 * 改成行业最佳实践」): a title and a close button in its head; a tap on the dim around it or Escape closes it too; while it
 * is open the page behind neither scrolls nor takes a touch (it lies on `body`, everything else there inert), and focus
 * moves into it and back to where it was.
 */
export function Modal({ title, onClose, testId, closeTestId, children }: { title: string; onClose: () => void; testId: string; closeTestId?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null)
  const closeButton = useRef<HTMLButtonElement | null>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    const others = [...document.body.children].filter((el) => el !== box.current && !el.hasAttribute('inert'))
    for (const el of others) el.setAttribute('inert', '')
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButton.current?.focus()
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current()
    }
    document.addEventListener('keydown', escape)
    return () => {
      html.style.overflow = overflow
      for (const el of others) el.removeAttribute('inert')
      document.removeEventListener('keydown', escape)
      before?.focus()
    }
  }, [])
  return createPortal(
    <div ref={box} data-testid={testId} {...stylex.props(styles.scrim)} onClick={() => close.current()}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} {...stylex.props(styles.modal)}>
        <div {...stylex.props(styles.modalHead)}>
          <h2 {...stylex.props(typography.dialogTitle, styles.modalTitle)}>{title}</h2>
          <button ref={closeButton} type="button" aria-label={m.settings_close()} data-testid={closeTestId ?? `${testId}-close`} onClick={() => close.current()} {...stylex.props(styles.modalClose)}>
            <X size={icon.menu} strokeWidth={icon.outline} />
          </button>
        </div>
        {/* The body scrolls, not the box: its scroll bar stands inside the dialog's padding, never on its edge (SKATGO-156,
            the human: 「所有的弹窗，都要让滚动条在弹窗内部，而不是贴道外部」). */}
        <div data-testid={`${testId}-body`} {...stylex.props(styles.modalBody)}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function Panel({ children, tone = 'card', pad = true, fill = false }: { children: ReactNode; tone?: 'card' | 'tip' | 'good' | 'bad'; pad?: boolean; fill?: boolean }) {
  return <div {...stylex.props(styles.panel, panelTones[tone], pad && styles.panelPad, fill && styles.panelFill)}>{children}</div>
}

/** A tip: the tip panel around the words. */
export function Tip({ children }: { children: ReactNode }) {
  return <Panel tone="tip">{children}</Panel>
}

/** A short fact, never an action: white on the page, dark on the felt, amber for whose turn it is. */
export function Pill({ children, tone = 'quiet' }: { children: ReactNode; tone?: 'quiet' | 'go' | 'good' | 'dark' | 'amber' }) {
  return <span {...stylex.props(typography.appBtn, styles.pill, pillTones[tone])}>{typeof children === 'string' ? keepParts(children) : children}</span>
}

/** A fact made of parts ("Alleinspieler: Noah · gereizt bis 18") breaks only after a " · ", never inside a
 *  part or before the dot (SKATGO-58). A sentence of one part wraps between words like any text, so a
 *  long one never runs out past the screen's edge (SKATGO-65). */
const keepParts = (text: string) =>
  text.includes(' · ') ? text.split(' · ').map((part) => part.replace(/ /g, '\u00A0')).join('\u00A0· ') : text

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

/** A suit symbol in text, in its suit's text colour. */
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
  // The dialog (`Modal`): the dim over the page, the white card in its middle.
  scrim: {
    position: 'fixed',
    inset: 0,
    zIndex: layer.modal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.x16,
    backgroundColor: color.scrim,
    overscrollBehavior: 'contain',
    touchAction: 'none',
  },
  modal: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: dims.settingsWidth,
    // A phone held sideways is shorter than the dialog: its body scrolls inside, never the page.
    maxHeight: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: space.x24,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
    color: color.text,
  },
  modalHead: { display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', gap: space.x12 },
  modalBody: { display: 'flex', flexDirection: 'column', gap: space.x16, flexGrow: 1, flexShrink: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', touchAction: 'pan-y' },
  modalTitle: { margin: 0, color: color.navy },
  modalClose: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.control,
    height: dims.control,
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.round,
    backgroundColor: { default: 'transparent', ':hover': color.page },
    color: color.navy,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
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
  area: { width: '100%', resize: 'vertical', fieldSizing: 'content' },
  areaPost: { minHeight: dims.textPost },
  areaComment: { minHeight: dims.textComment },
  switch: {
    minHeight: dims.control,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
    color: color.navy,
    borderRadius: radii.pill,
    paddingInline: space.x16,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  switchLink: { display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', textDecoration: 'none' },
  switchOn: { backgroundColor: color.goodSoft, borderColor: color.go },
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
  panelFill: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, boxSizing: 'border-box' },
  // A pill is never wider than where it sits (SKATGO-58): a fact too long for its row wraps inside the
  // pill instead of running out of the panel. A short one looks as it always did.
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x6,
    boxSizing: 'border-box',
    maxWidth: '100%',
    minHeight: dims.control,
    paddingInline: space.x16,
    paddingBlock: space.x6,
    borderRadius: radii.pill,
    textAlign: 'center',
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
// The public site's green buttons are the app's own green (SKATGO-97, the human: 「首页play today's tournament按钮改成
// 我们按钮的标准绿色」): its landing shape and type only.
const landingTones = stylex.create({
  go: {},
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
