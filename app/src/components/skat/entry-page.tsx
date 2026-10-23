import { Link, useLoaderData } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { track } from '~/lib/analytics'
import { faq } from '~/lib/faq'
import type { Card } from '~/lib/skat/cards'
import { lessons } from '~/lib/skat/lessons/content'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { timing } from '../../theme/effects.stylex'
import { elev, pose, veil } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { AnnouncementLine } from './forum-announcement'
import { PlayingCard } from './playing-card'
import { linkLook } from './ui'


// The front page, in the lobby design (SKATGO-26, reference.md): the public site's hero — the daily Skat
// tournament as the headline and its one green call to action (the way into the course is the header's
// and the course tile's — the human, 2026-10-01) and a strip of facts, set in the middle with no picture beside it
// (SKATGO-120, the human: 「pc上我也不想要那个图片了」) — then the two other ways into Skat as the app's colour tiles, one suit
// each (♣ the course, ♠ free play, ♥ a private table with friends — SKATGO-61), and the questions people ask (SKATGO-29). The hero's copy leads the
// tournament itself (the human, 2026-09-30: 「文案先行」).
//
// Every picture here is skatgo's own: the public-domain deck the course plays with, fanned on felt, and
// the suits as outline icons. Rendered on the server; the learner's progress is applied after mount.
export function EntryPage() {
  const course = lessons()
  const announcement = useLoaderData({ from: '/' })

  return (
    <div data-testid="entry" {...stylex.props(styles.root)}>
      <section data-testid="entry-hero" {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.heroText)}>
          {/* Only when there is one: an empty line would still take a gap above the headline. */}
          {announcement ? (
            <div {...stylex.props(styles.news)}>
              <AnnouncementLine announcement={announcement} />
            </div>
          ) : null}
          <div {...stylex.props(styles.head)}>
            <h1 {...stylex.props(typography.landingHero, styles.title)}>{m.entry_title()}</h1>
            <p {...stylex.props(typography.landingHeroLead, styles.lead)}>{m.entry_lead()}</p>
          </div>
          <div {...stylex.props(styles.cta)}>
            <div {...stylex.props(styles.actions)}>
              <Link to="/daily" data-testid="entry-cta" onClick={() => heroClick('primary')} {...linkLook('go', 'lg', 'landing')}>
                {m.entry_cta()}
              </Link>
              {/* The forum beside it, white, so the tournament stays the one green action (SKATGO-120, the human:
                  「把solve puzzles 换成论坛按钮」; the puzzles keep their tile below). */}
              <Link to="/forum" data-testid="entry-forum" onClick={() => heroClick('forum')} {...linkLook('quiet', 'lg', 'landing')}>
                {m.entry_forum_cta()}
              </Link>
            </div>
            {/* What a first-time visitor wants to know before pressing it, quietly (the human, 2026-10-01). */}
            <ul data-testid="entry-points" {...stylex.props(styles.points)}>
              {[m.entry_point_free(), m.entry_point_no_signup(), m.entry_point_ai()].map((point) => (
                <li key={point} {...stylex.props(typography.appText, styles.point)}>
                  <span aria-hidden="true" {...stylex.props(styles.check)}>✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The four ways in, each a tile that is its own link with a title that says where it goes, nothing else
          (SKATGO-120, the human: 「里面按钮去掉，描述文字去掉，只要标题，标题具备描述性即可」). */}
      <div data-testid="entry-sections" {...stylex.props(styles.ways)}>
        <Link to="/course" data-testid="entry-card" data-section="course" {...stylex.props(styles.tile, styles.tileLink, tileTones.course)}>
          <Face art={COURSE_ART} title={m.entry_new_title({ count: course.length })} />
        </Link>
        <Link to="/play" data-testid="entry-card" data-section="play" {...stylex.props(styles.tile, styles.tileLink, tileTones.play)}>
          <Face art={PLAY_ART} title={m.entry_game_title()} />
        </Link>
        {/* The tricks (SKATGO-82): straight to the exercises (SKATGO-105); the article is only for search engines. */}
        <Link to="/skat-tricks" data-testid="entry-card" data-section="tricks" {...stylex.props(styles.tile, styles.tileLink, tileTones.practice)}>
          <Face art={PRACTICE_ART} title={m.entry_practice_title()} />
        </Link>
        <Link to="/with-friends" data-testid="entry-card" data-section="friends" {...stylex.props(styles.tile, styles.tileLink, tileTones.friends)}>
          <Face art={FRIENDS_ART} title={m.entry_friends_title()} />
        </Link>
      </div>

      <nav aria-label={m.game_learning_title()} {...stylex.props(styles.actions)}>
        <Link to="/rules" {...stylex.props(typography.link, styles.readingLink)}>{m.rules_title()}</Link>
        <Link to="/course" {...stylex.props(typography.link, styles.readingLink)}>{m.course_title()}</Link>
      </nav>

      <section data-testid="entry-faq" aria-labelledby="faq-title" {...stylex.props(styles.faq)}>
        <h2 id="faq-title" {...stylex.props(typography.landingHeading, styles.faqTitle)}>{m.faq_title()}</h2>
        <dl {...stylex.props(styles.faqList)}>
          {faq().map(({ q, a }) => (
            <div key={q} {...stylex.props(styles.faqItem)}>
              <dt {...stylex.props(typography.optionTitle, styles.faqQ)}>{q}</dt>
              <dd {...stylex.props(typography.landingBody, styles.faqA)}>{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

/** The hero's buttons (SKATGO-29; renamed by SKATGO-74's tracking plan; the forum's since SKATGO-120). */
const heroClick = (button: 'primary' | 'forum') => track('home_cta_clicked', { button })


const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })
const COURSE_ART = [card('C', 'J'), card('S', 'J'), card('H', 'J')]
const PLAY_ART = [card('S', 'A'), card('S', '10'), card('S', 'K')]
const FRIENDS_ART = [card('H', 'A'), card('H', '10'), card('H', 'K')]
const PRACTICE_ART = [card('D', 'A'), card('D', '10'), card('D', 'K')]
const FAN = ['fanFarLeft', 'fanLeft', 'fanMid', 'fanRight', 'fanFarRight'] as const

/** The hero's picture: three players at a club-shaped table (the human's illustration, SKATGO-33), shown whole. */
/** A tile's face: three of skatgo's cards in the corner under the tile's colour, and its title at the top left. */
function Face({ art, title }: { art: Card[]; title: string }) {
  return (
    <>
      <span aria-hidden="true" {...stylex.props(styles.art)}>
        {art.map((c, i) => (
          <span key={i} {...stylex.props(styles.artCard, fanPose[FAN[i + 1]])}>
            <PlayingCard card={c} size="lg" />
          </span>
        ))}
      </span>
      <span aria-hidden="true" {...stylex.props(styles.veil)} />
      <div {...stylex.props(styles.body)}>
        <h2 {...stylex.props(typography.tileTitle, styles.tileTitle)}>{title}</h2>
      </div>
    </>
  )
}

const fanPose = stylex.create({
  fanFarLeft: { transform: pose.fanFarLeft },
  fanLeft: { transform: pose.fanLeft },
  fanMid: { transform: pose.fanMid },
  fanRight: { transform: pose.fanRight },
  fanFarRight: { transform: pose.fanFarRight },
})

const tileTones = stylex.create({
  course: { backgroundColor: color.tileOrange, boxShadow: elev.tileOrange },
  play: { backgroundColor: color.tileGreen, boxShadow: elev.tileGreen },
  friends: { backgroundColor: color.tileRed, boxShadow: elev.tileRed },
  practice: { backgroundColor: color.tileNavy, boxShadow: elev.tileNavy },
})

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: space.x48, [bp.phone]: space.x32 },
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x32, [bp.phone]: space.x32 },
    paddingBottom: space.x72,
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  // Type alone, in the middle; on a phone it keeps to the left edge as the rest of the page (SKATGO-120). Above
  // the headline only the page's own top, and the lead held close under it as one block (the human:
  // 「这句话上方的空白太多……缩小它」, then 「我感觉它上下空白还是太多」).
  hero: { display: 'flex', flexDirection: 'column' },
  heroText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: { default: 'center', [bp.phone]: 'flex-start' },
    textAlign: { default: 'center', [bp.phone]: 'start' },
    minWidth: 0,
    gap: { default: space.x24, [bp.phone]: space.x16 },
  },
  news: { display: 'flex', justifyContent: { default: 'center', [bp.phone]: 'flex-start' } },
  head: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: { default: 'center', [bp.phone]: 'flex-start' },
    gap: { default: space.x12, [bp.phone]: space.x16 },
  },
  // Colour is stated, not inherited: the theme colours headings and paragraphs itself.
  title: { margin: 0, color: color.navy, textWrap: 'balance' },
  lead: { margin: 0, maxWidth: dims.readingColumn, color: color.slate, textWrap: 'balance' },
  // The facts under the call to action: one quiet line that wraps on a phone.
  points: { display: 'flex', flexWrap: 'wrap', justifyContent: { default: 'center', [bp.phone]: 'flex-start' }, columnGap: space.x16, rowGap: space.x4, margin: 0, padding: 0, listStyleType: 'none' },
  point: { display: 'inline-flex', gap: space.x6, margin: 0, color: color.slate },
  check: { color: color.go },

  // The call to action with its facts right under it.
  cta: { display: 'flex', flexDirection: 'column', alignItems: { default: 'center', [bp.phone]: 'flex-start' }, gap: space.x12 },
  actions: { display: 'flex', flexWrap: 'wrap', justifyContent: { default: 'center', [bp.phone]: 'flex-start' }, gap: space.x12 },
  // The two ways in, side by side; stacked on a phone.
  ways: {
    display: 'grid',
    // Two by two, each title on one line clear of its cards (four in a row crowded the titles onto the art,
    // SKATGO-120); below the width where that holds, one above the other, as the course's cards.
    gridTemplateColumns: { default: dims.twoColumns, [bp.cards]: dims.oneColumn },
    columnGap: space.x15,
    rowGap: space.x15,
  },
  // A lobby tile: its colour over its art, a shadow in its own colour, its title and text at the top left
  // and its button at the bottom, so tiles side by side line up whatever their text's length (SKATGO-69).
  tile: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    // As tall as its title, no more; the cards' art is cropped at its edge (SKATGO-120, the human: 「包裹着文字就行了，
    // 禁止大片空白，牌的背景还保留，但是可以剪裁」).
    boxSizing: 'border-box',
    padding: space.x27,
    overflow: 'hidden',
    borderRadius: radii.tile,
    color: color.onColor,
    textDecoration: 'none',
  },
  // The whole tile is the link: it rises on hover and shows the focus ring, as a course card does.
  tileLink: {
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  art: {
    position: 'absolute',
    right: dims.tileArtRight,
    bottom: dims.tileArtBottom,
    display: 'flex',
    transform: pose.tileArt,
    pointerEvents: 'none',
  },
  artCard: { display: 'block', marginInline: dims.fanRowOverlap, transformOrigin: 'bottom center' },
  veil: { position: 'absolute', inset: 0, backgroundColor: 'inherit', opacity: veil.tile, pointerEvents: 'none' },
  body: { position: 'relative', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: space.x8 },
  tileTitle: { margin: 0, color: color.onColor },
  readingLink: { color: color.info, textDecoration: 'underline' },

  faq: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  faqTitle: { margin: 0, color: color.navy },
  faqList: { display: 'flex', flexDirection: 'column', margin: 0 },
  faqItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingBlock: space.x20,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  faqQ: { margin: 0, color: color.navy },
  faqA: { margin: 0, color: color.slate },
})
