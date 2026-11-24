import * as stylex from '@stylexjs/stylex'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { icon } from '../../theme/constants'
import { geist, geistDims, geistShape } from '../../theme/geist.stylex'
import { border, opacity, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

// The forum's own small kit in Geist (SKATGO-231, the human: 「最好严格用它的论坛设计系统」): the button, the pill, the icon
// button, the avatar and the text fields as the Vercel Community draws them. Only the forum uses it; every other page
// keeps the lobby design's kit (ui.tsx).

/** A button: `primary` the one main action (Geist's dark fill), `secondary` a white one with a hairline, `destructive`
 *  the yes to a deletion. */
export function GButton({ tone = 'primary', onClick, disabled, testId, children, Icon }: {
  tone?: 'primary' | 'secondary' | 'destructive'
  onClick?: () => void
  disabled?: boolean
  testId?: string
  children: ReactNode
  Icon?: LucideIcon
}) {
  return (
    <button type="button" data-testid={testId} disabled={disabled} onClick={onClick} {...stylex.props(typography.forumName, s.button, s[tone], disabled && s.disabled)}>
      {Icon ? <Icon size={icon.forum} aria-hidden /> : null}
      {children}
    </button>
  )
}

/** The same look for a link that leaves the site, such as a video's way to YouTube. */
export function gLinkLook(tone: 'primary' | 'secondary' = 'primary') {
  return stylex.props(typography.forumName, s.button, s[tone])
}

/** A pill: a tab or a filter; the chosen one dark. For a button; `gPillLook` gives a router `<Link>` the same. */
export function GPill({ chosen, onClick, testId, children }: { chosen: boolean; onClick: () => void; testId?: string; children: ReactNode }) {
  return (
    <button type="button" data-testid={testId} aria-pressed={chosen} onClick={onClick} {...stylex.props(typography.forumPill, s.pill, chosen && s.pillChosen)}>
      {children}
    </button>
  )
}

export function gPillLook(chosen: boolean) {
  return stylex.props(typography.forumPill, s.pill, chosen && s.pillChosen)
}

/** A square button with one icon and its name for screen readers: Geist's 32 with a hairline. */
export function GIconButton({ Icon, label, onClick, testId, pressed }: { Icon: LucideIcon; label: string; onClick: () => void; testId?: string; pressed?: boolean }) {
  return (
    <button type="button" data-testid={testId} aria-label={label} title={label} aria-pressed={pressed} onClick={onClick} {...stylex.props(s.iconButton)}>
      <Icon size={icon.forum} aria-hidden />
    </button>
  )
}

/** Someone's mark: SkatGo's logo for SkatGo, a player's initial on Geist's grey — the forum has no pictures of people. */
export function Avatar({ name, official, size = 'row' }: { name: string; official: boolean; size?: 'row' | 'post' | 'tiny' }) {
  const box = size === 'row' ? s.avatarRow : size === 'post' ? s.avatarPost : s.avatarTiny
  if (official) return <img src="/logo-96.png" alt="" {...stylex.props(s.avatar, s.avatarLogo, box)} />
  const letter = Array.from(name.trim())[0]?.toUpperCase() ?? '?'
  return (
    <span aria-hidden {...stylex.props(size === 'row' ? typography.forumName : typography.forumSmall, s.avatar, s.avatarLetter, box)}>
      {letter}
    </span>
  )
}

/** One line of text. */
export function GInput({ id, testId, value, onChange }: { id: string; testId?: string; value: string; onChange: (value: string) => void }) {
  return <input id={id} data-testid={testId} type="text" value={value} onChange={(e) => onChange(e.target.value)} {...stylex.props(typography.forumText, s.field)} />
}

/** Several lines, starting a few lines tall and growing with the text. */
export function GTextArea({ id, testId, value, onChange, size }: { id: string; testId?: string; value: string; onChange: (value: string) => void; size: 'post' | 'comment' }) {
  return (
    <textarea id={id} data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} {...stylex.props(typography.forumText, s.field, s.area, size === 'post' ? s.areaPost : s.areaComment)} />
  )
}

const focusRing = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focusSm,
  outlineColor: geist.focus,
  outlineOffset: border.focusSm,
} as const

const s = stylex.create({
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x6,
    flexShrink: 0,
    boxSizing: 'border-box',
    height: geistDims.control,
    margin: 0,
    paddingInline: space.x12,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderRadius: geistShape.card,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'background-color, color',
    ...focusRing,
  },
  primary: { color: geist.onText, backgroundColor: { default: geist.text, ':hover': geist.secondary }, borderColor: 'transparent' },
  secondary: { color: geist.text, backgroundColor: { default: geist.background, ':hover': geist.fill }, borderColor: geist.hairline },
  destructive: { color: geist.background, backgroundColor: geist.destructive, borderColor: 'transparent' },
  disabled: { opacity: opacity.disabled, cursor: 'default' },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    height: geistDims.pill,
    margin: 0,
    paddingBlock: space.x8,
    paddingInline: space.x12,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: geistShape.round,
    color: geist.text,
    backgroundColor: { default: geist.fill, ':hover': geist.fillHover },
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    cursor: 'pointer',
    ...focusRing,
  },
  pillChosen: { color: geist.onText, backgroundColor: { default: geist.text, ':hover': geist.text } },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: geistDims.control,
    height: geistDims.control,
    margin: 0,
    padding: 0,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: geist.hairline,
    borderRadius: geistShape.control,
    color: { default: geist.secondary, ':hover': geist.text },
    backgroundColor: { default: geist.background, ':hover': geist.fill },
    cursor: 'pointer',
    ...focusRing,
  },
  avatar: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: geistShape.round, overflow: 'hidden' },
  avatarLogo: { boxSizing: 'border-box', objectFit: 'contain', backgroundColor: geist.background, borderWidth: border.hair, borderStyle: 'solid', borderColor: geist.hairline },
  avatarLetter: { color: geist.secondary, backgroundColor: geist.fill },
  avatarRow: { width: geistDims.avatar, height: geistDims.avatar },
  avatarPost: { width: geistDims.avatarPost, height: geistDims.avatarPost },
  avatarTiny: { width: geistDims.avatarTiny, height: geistDims.avatarTiny },
  field: {
    boxSizing: 'border-box',
    width: '100%',
    margin: 0,
    paddingBlock: space.x8,
    paddingInline: space.x12,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: geist.hairline,
    borderRadius: geistShape.control,
    color: geist.text,
    backgroundColor: geist.background,
    ...focusRing,
  },
  area: { resize: 'vertical', fieldSizing: 'content' },
  areaPost: { minHeight: geistDims.textPost },
  areaComment: { minHeight: geistDims.textComment },
})
