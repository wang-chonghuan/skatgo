import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { DAILY_DEALS } from '~/lib/daily'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

/** Public game facts, separate from browser-only cards, scores and player state. */
export function GameReading({ daily = false }: { daily?: boolean }) {
  return (
    <section data-testid="game-reading" {...stylex.props(styles.root)}>
      {daily ? (
        <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.daily_about_title()}</h2>
      ) : (
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.play_title()}</h1>
      )}
      <p {...stylex.props(typography.body, styles.text)}>{daily ? m.daily_about_intro({ deals: DAILY_DEALS }) : m.play_about_intro()}</p>
      <h2 {...stylex.props(typography.optionTitle, styles.title)}>{daily ? m.daily_scoring_title() : m.play_about_title()}</h2>
      <p {...stylex.props(typography.body, styles.text)}>{daily ? m.daily_scoring_text() : m.play_about_text()}</p>
      <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.game_learning_title()}</h2>
      <p {...stylex.props(typography.body, styles.text)}>{m.game_learning_text()}</p>
      <nav aria-label={m.nav_label()} {...stylex.props(styles.links)}>
        {daily ? null : <Link to="/with-friends" data-testid="play-friends" {...stylex.props(typography.link, styles.link)}>{m.friends_link()}</Link>}
        <Link to="/rules" {...stylex.props(typography.link, styles.link)}>{m.nav_rules()}</Link>
        <Link to="/course" {...stylex.props(typography.link, styles.link)}>{m.nav_course()}</Link>
        <Link to={daily ? '/play' : '/daily'} {...stylex.props(typography.link, styles.link)}>{daily ? m.nav_play() : m.nav_daily()}</Link>
        <Link to="/" {...stylex.props(typography.link, styles.link)}>{m.nav_home_link()}</Link>
      </nav>
    </section>
  )
}

/** The look of a link in reading text, shared with the friends page (SKATGO-61). */
export const readingLink = () => stylex.props(typography.link, styles.link)

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: space.x32,
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
    backgroundColor: color.page,
  },
  title: { margin: 0, color: color.navy, overflowWrap: 'anywhere' },
  text: { margin: 0, color: color.text },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  link: {
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
