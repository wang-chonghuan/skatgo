import { type Card, type Rank, type Suit } from './skat/cards'

// The forum (SKATGO-118): the official's announcements and articles, players' posts, and flat comments under
// every post — the human: 「评论不要搞嵌套……用户自己 @ 一个人就行，也不用通知」. One forum per language. The
// rules here are shared by the multiplayer service, which stores and judges every write, and by the pages,
// which show and link what it answers. Nothing here sends a notification, and nothing ever will.
//
// One forum for both languages (the human, in review: 「德语和英语论坛不要分开」): the pages' own words follow the
// site's language, and a post or comment is in whatever language its author writes (「别人想发什么语言就发什么语言」);
// nothing records which. Translating them is for later.

export const FORUM_SECTIONS = ['news', 'articles', 'talk', 'feedback'] as const
export type ForumSection = (typeof FORUM_SECTIONS)[number]

/** Where only the official may start a post. */
export const OFFICIAL_SECTIONS: readonly ForumSection[] = ['news']

/** The sections an author may post in. */
export const sectionsFor = (official: boolean): ForumSection[] => FORUM_SECTIONS.filter((s) => official || !OFFICIAL_SECTIONS.includes(s))

export const TITLE_MIN = 3
export const TITLE_MAX = 120
export const POST_MAX = 20_000
export const COMMENT_MAX = 3_000
export const REASON_MAX = 500

/** What one account may write in a day; the official has no limit. */
export const DAILY_LIMITS = { posts: 5, comments: 30, reports: 20 } as const

export const PAGE_SIZE = 30

/** How long an announcement stands first in the list and as the line on the front page and /daily. */
export const ANNOUNCEMENT_DAYS = 14

export type ForumPostSummary = {
  id: number
  section: ForumSection
  title: string
  /** The text's start, without its marks, for the list (SKATGO-119). */
  excerpt: string
  /** The author's name on the leaderboard — never an account id or an email address. */
  author: string
  official: boolean
  createdAt: number
  lastActivity: number
  comments: number
  /** Whether search engines may index the post (`postIndexable`). */
  indexable: boolean
  /** A player's post the official marked for search engines. */
  indexed: boolean
  /** Why the official hid it — seen only by its author and the official. */
  hidden: string | null
  /** Written by the viewer. */
  mine: boolean
}

export type ForumComment = {
  id: number
  author: string
  official: boolean
  body: string
  createdAt: number
  hidden: string | null
  mine: boolean
}

export type ForumPost = ForumPostSummary & { body: string; thread: ForumComment[] }

/** Who is looking: whether they may moderate, and whether they are signed in at all. */
export type ForumViewer = { signedIn: boolean; official: boolean }

export type ForumList = { posts: ForumPostSummary[]; more: boolean; viewer: ForumViewer }

export type ForumThread = { post: ForumPost; viewer: ForumViewer }

export type ForumAnnouncement = { id: number; title: string; createdAt: number }

/** One reported post or comment, as the official's list shows it. */
export type ForumReport = {
  /** The newest open report on it; dismissing it closes every open report on the same thing. */
  id: number
  postId: number
  postTitle: string
  commentId: number | null
  author: string
  excerpt: string
  hidden: string | null
  reasons: string[]
  count: number
  createdAt: number
}

/** Whether search engines may read a post: the official's, or a player's the official marked — never a
 *  hidden one and never feedback (SKATGO-118: user content is not indexed until the official says so). */
export function postIndexable(p: { section: ForumSection; official: boolean; indexed: boolean; hidden: string | null }): boolean {
  return p.hidden === null && p.section !== 'feedback' && (p.official || p.indexed)
}

const FOLD: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

/** A title as an address: German letters spelt out, everything else that is not a letter or digit a hyphen. */
export function slugOf(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => FOLD[c])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return slug || 'post'
}

/** A post's route path: its number, then its title as a slug. */
export const postParam = (p: { id: number; title: string }) => `${p.id}-${slugOf(p.title)}`
export const postPath = (p: { id: number; title: string }) => `/forum/${postParam(p)}`

/** The post's number from its address, or null. */
export function postIdOf(param: string): number | null {
  const match = /^(\d{1,15})(?:-|$)/.exec(param)
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// The text of a post or comment: plain text with a few marks a player can type on a phone.
//   ## Heading / ### Heading      a heading (the post's title is the page's only h1)
//   - item / * item / 1. item     a list
//   **bold**                       bold (and every suit symbol in its colour, as everywhere on the site)
//   [text](https://…), https://…   a link
//   [♠A ♠10 ♥K]                    a row of cards, on a line of its own: A K D/Q B/J 10 9 8 7
// Anything else is a paragraph; a single line break stays a line break.

type ListBlock = { kind: 'ul'; items: string[] } | { kind: 'ol'; items: string[] }
export type ForumBlock =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | ListBlock
  | { kind: 'cards'; cards: Card[] }

const SUIT_OF: Record<string, Suit> = { '♣': 'C', '♠': 'S', '♥': 'H', '♦': 'D' }
const RANK_OF: Record<string, Rank> = { A: 'A', K: 'K', D: 'Q', Q: 'Q', B: 'J', J: 'J', '10': '10', '9': '9', '8': '8', '7': '7' }
const CARD = /^([♣♠♥♦])(10|[AKDQBJ987])$/
/** The most cards one row shows: a hand and a skat. */
const ROW_MAX = 12

/** A line that is a row of cards, or null. */
export function cardRow(line: string): Card[] | null {
  const inner = /^\[([^\]]+)\]$/.exec(line.trim())?.[1]
  if (!inner) return null
  const tokens = inner.trim().split(/\s+/)
  if (tokens.length > ROW_MAX) return null
  const row: Card[] = []
  for (const token of tokens) {
    const match = CARD.exec(token.toUpperCase())
    if (!match) return null
    row.push({ suit: SUIT_OF[match[1]], rank: RANK_OF[match[2]] })
  }
  return row
}

const LIST_ITEM = /^\s*(?:[-*]|(\d{1,3})\.)\s+(.+)$/

export function parseBody(text: string): ForumBlock[] {
  const blocks: ForumBlock[] = []
  let paragraph: string[] = []
  let list: ListBlock | null = null
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'p', lines: paragraph })
    if (list) blocks.push(list)
    paragraph = []
    list = null
  }
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim())
    if (heading) {
      flush()
      blocks.push({ kind: heading[1].length === 3 ? 'h3' : 'h2', text: heading[2] })
      continue
    }
    const cards = cardRow(line)
    if (cards) {
      flush()
      blocks.push({ kind: 'cards', cards })
      continue
    }
    const item = LIST_ITEM.exec(line)
    if (item) {
      const kind = item[1] ? 'ol' : 'ul'
      if (paragraph.length || (list && list.kind !== kind)) flush()
      list ??= kind === 'ol' ? { kind, items: [] } : { kind, items: [] }
      list.items.push(item[2])
      continue
    }
    if (list) flush()
    paragraph.push(line.trim())
  }
  flush()
  return blocks
}

export type InlinePart = { text: string } | { text: string; href: string }

const LINK = /\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]{1,500})\)|(https?:\/\/[^\s<>()]{1,500}[^\s<>().,;:!?'"])/g

/** A line's text and links, in order. Only http(s) addresses become links. */
export function inlineParts(line: string): InlinePart[] {
  const parts: InlinePart[] = []
  let at = 0
  for (const match of line.matchAll(LINK)) {
    if (match.index > at) parts.push({ text: line.slice(at, match.index) })
    parts.push(match[1] ? { text: match[1], href: match[2] } : { text: match[3], href: match[3] })
    at = match.index + match[0].length
  }
  if (at < line.length) parts.push({ text: line.slice(at) })
  return parts
}

/** The text without its marks, for a description or an excerpt: at most `max` characters, cut at a word. */
export function plainText(body: string, max = 155): string {
  const text = parseBody(body)
    .map((b) => (b.kind === 'p' ? b.lines.join(' ') : b.kind === 'cards' ? '' : 'text' in b ? b.text : b.items.join(' ')))
    .join(' ')
    .replace(LINK, (_, label: string | undefined, _href: string | undefined, bare: string | undefined) => label ?? bare ?? '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2))}…`
}
