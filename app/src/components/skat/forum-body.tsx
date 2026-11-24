import * as stylex from '@stylexjs/stylex'
import { Fragment } from 'react'

import { type ForumLang, forumImagePath, inlineParts, parseBody } from '~/lib/forum'
import { SITE_URL } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { geist, geistShape } from '../../theme/geist.stylex'
import { border, space } from '../../theme/scale.stylex'
import { radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { CardRowView } from './card-row'
import { Rich } from './ui'

/**
 * A forum post's or comment's text (SKATGO-118), from the few marks `parseBody` reads: paragraphs, headings,
 * lists, bold, links, rows of cards and, in SkatGo's posts, the site's own pictures (SKATGO-129, the human: 「给论坛增加加图片
 * 的功能」) in the page's language. Built as elements, never as HTML, so nothing a player types can become markup; a
 * player's picture line stays text. A player's links carry `ugc nofollow`; the official's to other sites only `noopener`.
 * In the forum it wears Geist (`geist`, SKATGO-231); the record of play's weekly notes keep the lobby design.
 */
export function ForumBody({ text, official, geist: geistLookOn = false }: { text: string; official: boolean; geist?: boolean }) {
  const look = geistLookOn ? geistLook : lobbyLook
  return (
    <div {...stylex.props(styles.body)}>
      {parseBody(text).map((block, i) => {
        if (block.kind === 'cards') return <CardRowView key={i} row={{ cards: block.cards }} />
        if (block.kind === 'image') {
          return official ? (
            <img key={i} src={forumImagePath(block.file, getLocale() as ForumLang)} alt={block.alt} loading="lazy" {...stylex.props(styles.image, look.image)} />
          ) : (
            <p key={i} {...stylex.props(look.textRole, look.text)}><Line text={block.line} official={official} look={look} /></p>
          )
        }
        if (block.kind === 'h2' || block.kind === 'h3') {
          const Heading = block.kind
          return <Heading key={i} {...stylex.props(block.kind === 'h2' ? look.h2 : look.h3, look.heading)}><Line text={block.text} official={official} look={look} /></Heading>
        }
        if (block.kind === 'ul' || block.kind === 'ol') {
          const List = block.kind
          return (
            <List key={i} {...stylex.props(look.textRole, styles.list, look.text, block.kind === 'ol' ? styles.numbered : styles.bulleted)}>
              {block.items.map((item, j) => <li key={j}><Line text={item} official={official} look={look} /></li>)}
            </List>
          )
        }
        return (
          <p key={i} {...stylex.props(look.textRole, look.text)}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                <Line text={line} official={official} look={look} />
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function Line({ text, official, look }: { text: string; official: boolean; look: Look }) {
  return (
    <>
      {inlineParts(text).map((part, i) => {
        if (!('href' in part)) return <Rich key={i} text={part.text} strong={look.strong} />
        const own = part.href === SITE_URL || part.href.startsWith(`${SITE_URL}/`)
        return (
          <a key={i} href={part.href} rel={own ? undefined : official ? 'noopener' : 'ugc nofollow noopener'} target={own ? undefined : '_blank'} {...stylex.props(look.link)}>
            {part.text}
          </a>
        )
      })}
    </>
  )
}

const styles = stylex.create({
  body: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0, overflowWrap: 'anywhere' },
  list: { display: 'flex', flexDirection: 'column', gap: space.x4, margin: 0, paddingInlineStart: space.x24 },
  image: { display: 'block', width: '100%', height: 'auto', boxSizing: 'border-box', borderWidth: border.hair, borderStyle: 'solid' },
  bulleted: { listStyleType: 'disc' },
  numbered: { listStyleType: 'decimal' },
})

const lobby = stylex.create({
  text: { margin: 0, color: color.text },
  heading: { margin: 0, color: color.navy },
  image: { borderColor: color.hairline, borderRadius: radii.panel, backgroundColor: color.surface },
  link: {
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})

// Geist's text (SKATGO-231): 14 on 20 in its text colour, links in the text's colour underlined, as the Vercel
// Community sets a post.
const inGeist = stylex.create({
  text: { margin: 0, color: geist.text },
  strong: { color: geist.text },
  heading: { margin: 0, color: geist.text },
  image: { borderColor: geist.hairline, borderRadius: geistShape.card, backgroundColor: geist.background },
  link: {
    color: geist.text,
    textDecoration: 'underline',
    textDecorationColor: { default: geist.muted, ':hover': geist.text },
    textUnderlineOffset: border.focusOffset,
    borderRadius: geistShape.control,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: geist.focus,
  },
})

type Look = {
  textRole: stylex.StyleXStyles; h2: stylex.StyleXStyles; h3: stylex.StyleXStyles
  text: stylex.StyleXStyles; heading: stylex.StyleXStyles; image: stylex.StyleXStyles; link: stylex.StyleXStyles
  strong?: stylex.StyleXStyles
}
const lobbyLook: Look = { textRole: typography.appText, h2: typography.optionTitle, h3: typography.appBtnStrong, ...lobby }
const geistLook: Look = { textRole: typography.forumText, h2: typography.forumBodyHeading, h3: typography.forumName, ...inGeist, strong: [typography.forumStrong, inGeist.strong] }
