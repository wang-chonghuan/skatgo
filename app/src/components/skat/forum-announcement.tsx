import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { type ForumAnnouncement, postParam } from '~/lib/forum'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { Pill } from './ui'

/** The forum's newest announcement of the last two weeks (SKATGO-118), as one line on the front page and on
 *  /daily, where players are — nothing when there is none or the forum does not answer. */
export function AnnouncementLine({ announcement }: { announcement: ForumAnnouncement | null }) {
  if (!announcement) return null
  return (
    <Link to="/forum/$post" params={{ post: postParam(announcement) }} data-testid="forum-announcement" {...stylex.props(styles.line)}>
      <Pill tone="good">{m.forum_new_badge()}</Pill>
      <span {...stylex.props(typography.appLink, styles.title)}>{announcement.title}</span>
    </Link>
  )
}

const styles = stylex.create({
  line: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.x8,
    textDecoration: 'none',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  title: { color: color.info, textDecoration: { default: 'underline', ':hover': 'none' }, overflowWrap: 'anywhere' },
})
