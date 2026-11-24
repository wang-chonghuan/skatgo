import * as stylex from '@stylexjs/stylex'
import type { LucideIcon } from 'lucide-react'

import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { type Face, facePath } from '~/lib/forum'

// The forum's few pieces of its own (SKATGO-231), in the lobby design and its colours (the human: 「颜色要丰富一下，还要用
// skatgo的设计系统」): the avatars — of a post's title, of a player's name (the human: 「每个帖子都根据标题自动生成一个
// 这样的图片」, then 「同意」 to players by their names), a line's commenters, and the small icon buttons. Everything else is the
// kit's (ui.tsx).

/** An avatar at `src` (`avatarPath`, `facePath`): a post's picture, from its title, or a player's. `small` beside a
 *  byline, `ring` in a line's row of commenters, `big` at the top of /profile (SKATGO-232), the list's size otherwise. */
export function Avatar({ src, small, ring, big, testId }: { src: string; small?: boolean; ring?: boolean; big?: boolean; testId?: string }) {
  return (
    <img src={src} alt="" loading="lazy" data-testid={testId} {...stylex.props(s.avatar, big ? s.big : small || ring ? s.small : s.large, ring && s.ring)} />
  )
}

/** The players who commented on a post, their avatars overlapping, newest first; their names for screen readers. */
export function Participants({ people }: { people: { name: string; face: Face }[] }) {
  if (!people.length) return null
  return (
    <span data-testid="forum-participants" title={people.map((p) => p.name).join(', ')} {...stylex.props(s.stack)}>
      {people.map((p) => <Avatar key={p.name} src={facePath(p.face, p.name)} ring />)}
    </span>
  )
}

/** A small button with one icon and its name for screen readers: the bare icon, no circle or line (SKATGO-234), a soft
 *  ground while what it opens is open. */
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
  big: { width: dims.avatarProfile, height: dims.avatarProfile },
  ring: { marginInlineStart: { default: dims.avatarOverlap, ':first-child': 0 }, borderWidth: border.tile, borderStyle: 'solid', borderColor: color.surface },
  stack: { display: 'inline-flex', alignItems: 'center', flexShrink: 0 },
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
    borderWidth: 0,
    borderRadius: radii.tag,
    color: { default: color.slate, ':hover': color.navy },
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  iconPressed: { color: color.navy, backgroundColor: color.page },
})
