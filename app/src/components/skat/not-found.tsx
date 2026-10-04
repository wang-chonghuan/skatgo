import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

export function NotFoundPage() {
  return (
    <section {...stylex.props(styles.root)}>
      <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.not_found_title()}</h1>
      <p {...stylex.props(typography.appText, styles.text)}>{m.not_found_text()}</p>
      <Link to="/" {...stylex.props(typography.link, styles.link)}>{m.nav_home_link()}</Link>
    </section>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: space.x24, maxWidth: dims.readingColumn, padding: space.x24, marginInline: 'auto' },
  title: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  link: { color: color.info },
})
