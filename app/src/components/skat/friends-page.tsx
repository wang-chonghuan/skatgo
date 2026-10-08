import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, OpenTable, PrivateTable } from './client-part'
import { readingLink } from './game-reading'

/**
 * Skat with friends (SKATGO-61): the public page a search for "Skat mit Freunden online spielen" lands
 * on — what a private table is and how it goes, rendered on the server — and, in the browser, the name
 * and the button that open one.
 */
export function FriendsPage() {
  return (
    <div data-testid="friends" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.friends_title()}</h1>
        <p {...stylex.props(typography.landingBody, styles.lead)}>{m.friends_lead()}</p>
        {/* The form needs the browser; until it is there, nothing stands in its place. */}
        <ClientPart fallback={<span />}>
          <OpenTable />
        </ClientPart>
        <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.friends_how_title()}</h2>
        <ol {...stylex.props(styles.steps)}>
          {[m.friends_how_1(), m.friends_how_2(), m.friends_how_3()].map((step) => (
            <li key={step} {...stylex.props(typography.body, styles.text)}>{step}</li>
          ))}
        </ol>
        <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.friends_rules_title()}</h2>
        <p {...stylex.props(typography.body, styles.text)}>{m.friends_rules_text()}</p>
        <nav aria-label={m.nav_label()} {...stylex.props(styles.links)}>
          <Link to="/rules" {...readingLink()}>{m.nav_rules()}</Link>
          <Link to="/course" {...readingLink()}>{m.nav_course()}</Link>
          <Link to="/play" {...readingLink()}>{m.nav_header_free()}</Link>
        </nav>
      </section>
    </div>
  )
}

/**
 * A private table's own page (SKATGO-61): personal, never indexed. Its title is a heading for screen
 * readers only; the lobby or the table renders in the browser, bare felt holding its place until then.
 */
export function TablePage() {
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.table_title()}</h1>
      <ClientPart fallback={<div aria-hidden="true" {...stylex.props(styles.feltHold)} />}>
        <PrivateTable />
      </ClientPart>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  steps: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, paddingInlineStart: space.x24 },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  feltHold: { minHeight: dims.screenDynamic, backgroundImage: fill.felt },
  hidden: {
    position: 'absolute',
    width: dims.visuallyHidden,
    height: dims.visuallyHidden,
    margin: 0,
    overflow: 'hidden',
    clipPath: dims.visuallyHiddenClip,
    whiteSpace: 'nowrap',
  },
})
