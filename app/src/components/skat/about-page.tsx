import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { DAILY_DEALS } from '~/lib/daily'
import { faq } from '~/lib/faq'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

/**
 * About SkatGo (SKATGO-134): what the game pages no longer explain, in one place — the front page's questions, how the
 * daily Skat is played, scored and ranked, and how a private table goes. The human: 「我现在特别讨厌游戏页面里那么多垃圾的
 * 文字……所有seo的都专门做seo页面」. Rendered on the server; its questions are the page's FAQPage too.
 */
export function AboutPage() {
  return (
    <div data-testid="about" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.about_title()}</h1>

        <section data-testid="about-faq" aria-labelledby="about-faq-title" {...stylex.props(styles.section)}>
          <h2 id="about-faq-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.faq_title()}</h2>
          <dl {...stylex.props(styles.list)}>
            {faq().map(({ q, a }) => (
              <div key={q} {...stylex.props(styles.item)}>
                <dt {...stylex.props(typography.body, typography.emphasis, styles.title)}>{q}</dt>
                <dd {...stylex.props(typography.body, styles.text)}>{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section data-testid="about-daily" aria-labelledby="about-daily-title" {...stylex.props(styles.section)}>
          <h2 id="about-daily-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.about_daily_title()}</h2>
          <p {...stylex.props(typography.body, styles.text)}>{m.about_daily_1({ n: DAILY_DEALS })}</p>
          <p {...stylex.props(typography.body, styles.text)}>{m.about_daily_2()}</p>
          <p {...stylex.props(typography.body, styles.text)}>{m.about_daily_3()}</p>
          <p {...stylex.props(typography.body, styles.text)}>{m.about_learn()}</p>
          <nav aria-label={m.game_learning_title()} {...stylex.props(styles.links)}>
            <Link to="/daily" {...stylex.props(typography.link, styles.link)}>{m.dod_hero()}</Link>
            <Link to="/course" {...stylex.props(typography.link, styles.link)}>{m.course_title()}</Link>
            <Link to="/rules" {...stylex.props(typography.link, styles.link)}>{m.rules_title()}</Link>
          </nav>
        </section>

        <section data-testid="about-friends" aria-labelledby="about-friends-title" {...stylex.props(styles.section)}>
          <h2 id="about-friends-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.about_friends_title()}</h2>
          <p {...stylex.props(typography.body, styles.text)}>{m.about_friends_1()}</p>
          <p {...stylex.props(typography.body, styles.text)}>{m.about_friends_2()}</p>
          <nav aria-label={m.about_friends_title()} {...stylex.props(styles.links)}>
            <Link to="/with-friends" {...stylex.props(typography.link, styles.link)}>{m.friends_title()}</Link>
          </nav>
        </section>
      </article>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x32,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  section: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  title: { margin: 0, color: color.navy, overflowWrap: 'anywhere' },
  text: { margin: 0, color: color.text },
  list: { display: 'flex', flexDirection: 'column', gap: space.x16, margin: 0 },
  item: { display: 'flex', flexDirection: 'column', gap: space.x4 },
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
