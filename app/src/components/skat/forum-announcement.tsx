import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { type ForumAnnouncement, postParam } from '~/lib/forum'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { Pill } from './ui'

/** The forum's newest announcement of the last two weeks (SKATGO-118), as one line on the front page and on
 *  /daily, where players are — nothing when there is none or the forum does not answer. `badge`: the pill's word,
 *  "Neu" unless the place says more (the front page's "Neu im Forum", SKATGO-123). */
export function AnnouncementLine({ announcement, badge }: { announcement: ForumAnnouncement | null; badge?: string }) {
  if (!announcement) return null
  return (
    <Link to="/forum/$post" params={{ post: postParam(announcement) }} data-testid="forum-announcement" {...stylex.props(styles.line)}>
      <span {...stylex.props(styles.badge)}>
        <Pill tone="good">{badge ?? m.forum_new_badge()}</Pill>
      </span>
      <span {...stylex.props(typography.appLink, styles.title)}>{announcement.translated?.title ?? announcement.title}</span>
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
  // The pill keeps its words on one line; the title wraps beside it.
  badge: { display: 'inline-flex', flexShrink: 0, whiteSpace: 'nowrap' },
  title: { color: color.info, textDecoration: { default: 'underline', ':hover': 'none' }, overflowWrap: 'anywhere' },
})
