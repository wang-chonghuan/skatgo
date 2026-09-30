import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { ClientPart, FreeTable } from './client-part'
import { linkLook } from './ui'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

/**
 * Free play: a table with no lesson around it, for practice after the course or for people who already
 * play. The table fills the first screen (SKATGO-26); the page's title and text follow below it
 * (SKATGO-29), where they stay out of the game's way. Everything but the table is rendered on the
 * server; until the table arrives, bare felt holds its place.
 */
export function FreePlay() {
  return (
    <div {...stylex.props(styles.root)}>
      <ClientPart fallback={<div aria-hidden="true" {...stylex.props(styles.feltHold)} />}>
        <FreeTable />
      </ClientPart>
      <section data-testid="play-intro" {...stylex.props(styles.intro)}>
        <h1 {...stylex.props(typography.landingHeading, styles.h1)}>{m.play_title()}</h1>
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
  feltHold: { minHeight: dims.screenDynamic, backgroundImage: fill.felt },
  h1: { margin: 0, color: color.onColor },
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
