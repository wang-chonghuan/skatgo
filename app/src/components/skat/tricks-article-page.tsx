import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { TRICKS } from '~/lib/skat/tricks'
import { EXERCISES, EXERCISE_TEXT } from '~/lib/skat/tricks/exercises'
import type { TricksBlock } from '~/lib/skat/tricks/types'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Panel, Rich, linkLook } from './ui'

/**
 * The Skat-Tricks' first article (SKATGO-82): twelve tricks in plain words, with three ways into the daily
 * tournament and the pages to read on. It was the section's own page until the exercises took that place
 * (SKATGO-103); now it has its own address under it, and each trick links to the exercises that practise
 * it. Rendered on the server, like the rules.
 */
export function TricksArticlePage() {
  const locale = getLocale()
  const article = TRICKS[locale]
  return (
    <div data-testid="tricks-article" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{article.h1}</h1>
        {article.intro.map((text) => (
          <p key={text} {...stylex.props(typography.landingBody, styles.lead)}>
            <Rich text={text} />
          </p>
        ))}
        {article.blocks.map((block, i) => (
          <TricksBlockView key={i} block={block} />
        ))}
        <nav aria-labelledby="tricks-further" {...stylex.props(styles.further)}>
          <h2 id="tricks-further" {...stylex.props(typography.optionTitle, styles.heading)}>{article.further.title}</h2>
          <div {...stylex.props(styles.furtherLinks)}>
            {article.further.links.map((l) => (
              <Link key={l.to} to={l.to} {...stylex.props(typography.appLink, styles.link)}>{l.label}</Link>
            ))}
          </div>
        </nav>
      </article>
    </div>
  )
}

/** The kind of exercise that practises trick `n`: the first whose exercises name it (SKATGO-103). */
const practiceOf = (n: number) => EXERCISES.find((e) => e.trick === n)?.type

function TricksBlockView({ block }: { block: TricksBlock }) {
  if (block.kind === 'h2') return <h2 {...stylex.props(typography.optionTitle, styles.section)}>{block.title}</h2>
  if (block.kind === 'cta') {
    // A way into the daily tournament: the same action wherever it stands, so each carries the go button.
    return (
      <Panel tone="tip">
        <div data-testid="tricks-cta" {...stylex.props(styles.cta)}>
          <p {...stylex.props(typography.appText, styles.text)}>
            <Rich text={block.text} />
          </p>
          <div {...stylex.props(styles.action)}>
            <Link to="/daily" data-testid="tricks-cta-button" {...linkLook('go', 'md')}>{block.button}</Link>
          </div>
        </div>
      </Panel>
    )
  }
  const practice = practiceOf(block.n)
  return (
    <section id={`trick-${block.n}`} data-testid="tricks-trick" data-trick={block.n} {...stylex.props(styles.trick)}>
      <h3 {...stylex.props(typography.appBtnStrong, styles.heading)}>{`${block.n}. ${block.title}`}</h3>
      {block.paragraphs.map((text) => (
        <p key={text} {...stylex.props(typography.appText, styles.text)}>
          <Rich text={text} />
        </p>
      ))}
      {block.link ? (
        <Link to={block.link.to} {...stylex.props(typography.appLink, styles.link, styles.trickLink)}>{block.link.label}</Link>
      ) : null}
      {practice ? (
        <Link to="/skat-tricks" hash={practice} data-testid="tricks-practice-link" {...stylex.props(typography.appLink, styles.link, styles.trickLink)}>
          {m.tricks_practice({ type: EXERCISE_TEXT[getLocale()].types[practice].title })}
        </Link>
      ) : null}
    </section>
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
  section: { margin: 0, paddingTop: space.x16, color: color.navy },
  heading: { margin: 0, color: color.navy },
  trick: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  text: { margin: 0, color: color.text },
  cta: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  // A row of its own, so the button keeps its width instead of stretching across the panel.
  action: { display: 'flex' },
  further: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingTop: space.x16,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  furtherLinks: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  trickLink: { alignSelf: 'flex-start' },
})
