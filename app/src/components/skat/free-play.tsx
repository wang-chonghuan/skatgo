import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronLeft } from 'lucide-react'

import { ClientPart, FreeTable } from './client-part'
import { linkLook } from './ui'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { fill } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

/**
 * Free play: a table with no lesson around it, for practice after the course or for people who already
 * play. A thin bar carries the way back and the page's title, the table fills the rest of the first
 * screen (SKATGO-26), and the page's own text follows below it (SKATGO-29). Everything but the table is
 * rendered on the server; until the table arrives, bare felt holds its place.
 */
export function FreePlay() {
  return (
    <div {...stylex.props(styles.root)}>
      <header {...stylex.props(styles.bar)}>
        <Link to="/" data-testid="skat-back-start" {...stylex.props(typography.bandBack, styles.back)}>
          <ChevronLeft size={icon.bandNav} strokeWidth={icon.outline} />
          {m.back_to_start()}
        </Link>
        <h1 {...stylex.props(typography.panelLabel, styles.h1)}>{m.play_title()}</h1>
      </header>
      <ClientPart fallback={<div aria-hidden="true" {...stylex.props(styles.feltHold)} />}>
        <FreeTable />
      </ClientPart>
      <section data-testid="play-intro" {...stylex.props(styles.intro)}>
        <p {...stylex.props(typography.landingBody, styles.text)}>{m.play_intro()}</p>
        <div {...stylex.props(styles.links)}>
          <Link to="/course" {...linkLook('quiet', 'md', 'landing')}>{m.entry_cta_learn()}</Link>
          <Link to="/rules" {...linkLook('quiet', 'md', 'landing')}>{m.rules_title()}</Link>
        </div>
      </section>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  // A thin title bar above the table: the way back, then the page's title.
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x16,
    height: dims.playBar,
    boxSizing: 'border-box',
    // The assistant's launcher floats at the top right of this page; the title stops short of it.
    paddingInlineStart: { default: space.x16, [bp.phone]: space.x8 },
    paddingInlineEnd: space.x72,
    backgroundColor: color.feltOuter,
    color: color.onColor,
  },
  feltHold: { minHeight: dims.screenBelowPlayBar, backgroundImage: fill.felt },
  h1: { margin: 0, color: color.onColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  back: {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: space.x4,
    color: color.onColor,
    textDecoration: 'none',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.gold,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x48, [bp.phone]: space.x32 },
    paddingInline: { default: space.x24, [bp.phone]: space.x16 },
  },
  text: { margin: 0, color: color.onColor },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
})
