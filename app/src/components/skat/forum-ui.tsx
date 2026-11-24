import * as stylex from '@stylexjs/stylex'
import type { LucideIcon } from 'lucide-react'

import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// The forum's few pieces of its own (SKATGO-231), in the lobby design and its colours (the human: 「颜色要丰富一下，还要用
// skatgo的设计系统」): a player's avatar in one of the section tiles' colours, a lesson's number on the course's orange, and
// the small icon buttons. Everything else is the kit's (ui.tsx).

/** The colours an avatar is drawn in: the front page's section tiles and the AI blue, one per player by their name. */
const AVATAR_TONES = ['green', 'orange', 'navy', 'red', 'blue'] as const

function toneOf(name: string): (typeof AVATAR_TONES)[number] {
  let h = 0
  for (const c of name) h = (h * 31 + c.codePointAt(0)!) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

/** Someone's mark beside their name: SkatGo's logo for SkatGo, a player's initial in white on their colour — the forum
 *  has no pictures of people. `small` beside a post's or comment's byline, the list's size otherwise. */
export function Avatar({ name, official, small }: { name: string; official: boolean; small?: boolean }) {
  const box = small ? s.small : s.large
  if (official) return <img src="/logo-96.png" alt="" {...stylex.props(s.avatar, s.logo, box)} />
  const letter = Array.from(name.trim())[0]?.toUpperCase() ?? '?'
  return <span aria-hidden {...stylex.props(small ? typography.badge : typography.smallBold, s.avatar, s.letter, s[toneOf(name)], box)}>{letter}</span>
}

/** A lesson's number in the list, where a post has its author's avatar: white on the course's orange. */
export function LessonNumber({ n }: { n: number }) {
  return <span aria-hidden {...stylex.props(typography.smallBold, s.avatar, s.letter, s.orange, s.large)}>{n}</span>
}

/** A small round button with one icon and its name for screen readers. */
export function IconButton({ Icon, label, onClick, testId, pressed }: { Icon: LucideIcon; label: string; onClick: () => void; testId?: string; pressed?: boolean }) {
  return (
    <button type="button" data-testid={testId} aria-label={label} title={label} aria-pressed={pressed} onClick={onClick} {...stylex.props(s.iconButton, pressed && s.iconPressed)}>
      <Icon size={icon.small} aria-hidden />
    </button>
  )
}

const s = stylex.create({
  avatar: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box', borderRadius: radii.round, overflow: 'hidden' },
  large: { width: dims.avatar, height: dims.avatar },
  small: { width: dims.badge, height: dims.badge },
  logo: { objectFit: 'contain', backgroundColor: color.surface, borderWidth: border.hair, borderStyle: 'solid', borderColor: color.hairline },
  letter: { color: color.onColor },
  green: { backgroundColor: color.tileGreen },
  orange: { backgroundColor: color.tileOrange },
  navy: { backgroundColor: color.tileNavy },
  red: { backgroundColor: color.tileRed },
  blue: { backgroundColor: color.info },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: dims.iconButtonSm,
    height: dims.iconButtonSm,
    margin: 0,
    padding: 0,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    borderRadius: radii.round,
    color: { default: color.slate, ':hover': color.navy },
    backgroundColor: color.surface,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  iconPressed: { color: color.navy, boxShadow: elev.focus },
})
