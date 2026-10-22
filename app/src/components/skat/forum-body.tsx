import * as stylex from '@stylexjs/stylex'
import { Fragment } from 'react'

import { inlineParts, parseBody } from '~/lib/forum'
import { SITE_URL } from '~/lib/site'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { CardRowView } from './card-row'
import { Rich } from './ui'

/**
 * A forum post's or comment's text (SKATGO-118), from the few marks `parseBody` reads: paragraphs, headings,
 * lists, bold, links and rows of cards. Built as elements, never as HTML, so nothing a player types can become
 * markup. A player's links carry `ugc nofollow`; the official's to other sites only `noopener`.
 */
export function ForumBody({ text, official }: { text: string; official: boolean }) {
  return (
    <div {...stylex.props(styles.body)}>
      {parseBody(text).map((block, i) => {
        if (block.kind === 'cards') return <CardRowView key={i} row={{ cards: block.cards }} />
        if (block.kind === 'h2' || block.kind === 'h3') {
          const Heading = block.kind
          return <Heading key={i} {...stylex.props(block.kind === 'h2' ? typography.optionTitle : typography.appBtnStrong, styles.heading)}><Line text={block.text} official={official} /></Heading>
        }
        if (block.kind === 'ul' || block.kind === 'ol') {
          const List = block.kind
          return (
            <List key={i} {...stylex.props(typography.appText, styles.list, block.kind === 'ol' ? styles.numbered : styles.bulleted)}>
              {block.items.map((item, j) => <li key={j}><Line text={item} official={official} /></li>)}
            </List>
          )
        }
        return (
          <p key={i} {...stylex.props(typography.appText, styles.text)}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                <Line text={line} official={official} />
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function Line({ text, official }: { text: string; official: boolean }) {
  return (
    <>
      {inlineParts(text).map((part, i) => {
        if (!('href' in part)) return <Rich key={i} text={part.text} />
        const own = part.href === SITE_URL || part.href.startsWith(`${SITE_URL}/`)
        return (
          <a key={i} href={part.href} rel={own ? undefined : official ? 'noopener' : 'ugc nofollow noopener'} target={own ? undefined : '_blank'} {...stylex.props(styles.link)}>
            {part.text}
          </a>
        )
      })}
    </>
  )
}

const styles = stylex.create({
  body: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0, overflowWrap: 'anywhere' },
  text: { margin: 0, color: color.text },
  heading: { margin: 0, color: color.navy },
  list: { display: 'flex', flexDirection: 'column', gap: space.x4, margin: 0, paddingInlineStart: space.x24, color: color.text },
  bulleted: { listStyleType: 'disc' },
  numbered: { listStyleType: 'decimal' },
  link: {
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
