import { type Card, type Rank, type Suit } from './skat/cards'

// The forum (SKATGO-118): the official's announcements and articles, players' posts, and flat comments under
// every post — the human: 「评论不要搞嵌套……用户自己 @ 一个人就行，也不用通知」. One forum per language. The
// rules here are shared by the multiplayer service, which stores and judges every write, and by the pages,
// which show and link what it answers. Nothing here sends a notification outside the site: an "@Name" shows on that player's own page (SKATGO-232).
//
// One forum for both languages (the human, in review: 「德语和英语论坛不要分开」): the pages' own words follow the
// site's language, and a post or comment is in whatever language its author writes (「别人想发什么语言就发什么语言」);
// nothing records which. Each reader sees them in the site's language they read it in, machine-translated once per
// language and kept (SKATGO-124, the human: 「不管用户发啥语言的帖子，看到的都是他ui上的语言的翻译版」), the text as written one
// tap away.

// Two lists since SKATGO-234 (the human: 「当前论坛有三个栏目，我觉得应该精简，应该还改成声明和讨论，讨论是用户自己可以开帖，
// 声明是发布一些官方公告之类。高级课程不放这里了」): SkatGo's announcements and the players' discussion. SKATGO-231's third,
// the advanced course, left the forum for a course of its own (`/advanced-course`). The articles of before are SkatGo's
// announcements (SKATGO-231, the human, of the agent's advice: 「按建议改」). The first is the forum's own page.
export const FORUM_SECTIONS = ['news', 'talk'] as const
export type ForumSection = (typeof FORUM_SECTIONS)[number]

/** Where only the official may start a post: everywhere but the discussion. */
export const OFFICIAL_SECTIONS: readonly ForumSection[] = ['news']

/** How a list is sorted (SKATGO-231, the human: 「可以检索和排序（时间， 互动量）」): the newest first, or the most
 *  commented first. */
export const FORUM_SORTS = ['new', 'active'] as const
export type ForumSort = (typeof FORUM_SORTS)[number]

/** The longest search a list takes. */
export const QUERY_MAX = 100

/** How many of a post's commenters a list's line shows. */
export const PARTICIPANTS = 3

/** The longest text an avatar is drawn from. */
export const AVATAR_SEED_MAX = 200

/** The avatars' style, in their address: a browser keeps an avatar for a year, so a new style needs new addresses or
 *  it shows the old pictures (the human, after the style changed: 「有缓存，我看不出来」). Raise it with every change of
 *  style or options in lib/forum-handler.ts. */
export const AVATAR_STYLE = 'a4'

/** An avatar's address (SKATGO-231, the human: 「每个帖子都根据标题自动生成一个这样的图片」): the picture of a post's title as
 *  written, or of a player's name, drawn by the web service (lib/forum-handler.ts), the same text always the same
 *  picture. */
export const avatarPath = (seed: string) => `/api/forum/avatar/${AVATAR_STYLE}/${encodeURIComponent(seed.slice(0, AVATAR_SEED_MAX))}.svg`

/** A player's face (SKATGO-232, the human: 「每个用户打开profile页面，可以点击，刷新自己的头像。还能上传」): null for the
 *  picture of their name, as before; a seed they drew a new look from; or the id of the picture they uploaded. Never
 *  the account: only names and faces leave the forum. */
export type Face = { seed: string } | { image: string } | null

/** A face from a stored row: the picture uploaded, the seed drawn, or — neither — the picture of the name. */
export const faceOf = (seed: string | null | undefined, image: string | null | undefined): Face =>
  image ? { image } : seed ? { seed } : null

/** An uploaded picture's id: 32 hexadecimal digits, new with every upload, so its address is kept for a year. */
export const IMAGE_ID = /^[0-9a-f]{32}$/

/** An uploaded picture's address. */
export const imagePath = (id: string) => `/api/forum/avatar/u/${id}`

/** A face's picture: the uploaded one, or the drawing of its seed, or of the player's name. */
export const facePath = (face: Face, name: string) =>
  face && 'image' in face ? imagePath(face.image) : avatarPath(face?.seed ?? name)

/** An uploaded picture (SKATGO-232): the browser crops it square and draws it at this size, as WebP where it can
 *  write WebP, as JPEG where not, at most `IMAGE_BYTES`; the service takes nothing else. A file chosen may be
 *  at most `FILE_BYTES` before that. */
export const IMAGE_SIZE = 256
export const IMAGE_BYTES = 64 * 1024
export const FILE_BYTES = 10 * 1024 * 1024
export const IMAGE_TYPES = ['image/webp', 'image/jpeg'] as const
export type ImageType = (typeof IMAGE_TYPES)[number]
/** The files a player may choose. */
export const FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** The type an uploaded picture's bytes say it is, or null. */
export function imageTypeOf(bytes: Uint8Array): ImageType | null {
  const at = (i: number, ...b: number[]) => b.every((v, k) => bytes[i + k] === v)
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp'
  return null
}

/** How many players one post or comment may mention, and how many of a player's mentions /profile lists. */
export const MENTIONS_PER_TEXT = 10
export const MENTIONS_SHOWN = 20

/** The names an "@" in a text may stand for (SKATGO-232): for each "@", the words after it, one, two, … up to
 *  four, each without the marks that end a sentence, lower case — a name has spaces ("@Flinker Fuchs"). The
 *  service keeps, for each "@", the longest that is a player's name. */
export function mentionCandidates(text: string): string[][] {
  const out: string[][] = []
  for (const m of text.matchAll(/(?<![\p{L}\p{N}_])@([^\s@][^@\n]*)/gu)) {
    const words = m[1].trim().split(/\s+/u).slice(0, 4)
    const names: string[] = []
    for (let n = 1; n <= words.length; n++) {
      const name = words.slice(0, n).join(' ').replace(/[.,!?:;)\]"'»“”]+$/u, '').normalize('NFC').toLowerCase()
      if (name && !names.includes(name)) names.push(name)
    }
    if (names.length) out.push(names)
  }
  return out
}

/** A mention of the viewer, as /profile lists it: who, in which post, one line of the text, when; whether read. */
export type ForumMention = {
  id: number
  by: string
  face: Face
  official: boolean
  postId: number
  postTitle: string
  commentId: number | null
  excerpt: string
  createdAt: number
  unread: boolean
}

/** The viewer's own: their name and face, how many mentions they have not seen, and the latest. */
export type ForumMe = { name: string; face: Face; unread: number; mentions: ForumMention[] }

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

/** The languages a forum text is shown in: the site's (SKATGO-124). */
export const FORUM_LANGS = ['de', 'en'] as const
export type ForumLang = (typeof FORUM_LANGS)[number]

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
  /** In the reader's language, when it was written in another (SKATGO-124): the language it was written in, the title
   *  and the excerpt translated, and on a post's own page its body. Null while the translation is being made. */
  translated: { from: string; title: string; excerpt: string; body?: string } | null
  /** The players who commented on it, newest first, at most `PARTICIPANTS`, by name and face — SkatGo's own comments and deleted
   *  players' not among them (SKATGO-231). */
  participants: { name: string; face: Face }[]
  /** The author's face (SKATGO-232). */
  face: Face
}

export type ForumComment = {
  id: number
  author: string
  official: boolean
  body: string
  createdAt: number
  hidden: string | null
  mine: boolean
  /** In the reader's language, when it was written in another (SKATGO-124); null otherwise or while being made. */
  translated: { from: string; body: string } | null
  /** The author's face (SKATGO-232). */
  face: Face
}

export type ForumPost = ForumPostSummary & { body: string; thread: ForumComment[] }

/** Who is looking: whether they may moderate, and whether they are signed in at all. */
export type ForumViewer = { signedIn: boolean; official: boolean }

export type ForumList = { posts: ForumPostSummary[]; more: boolean; viewer: ForumViewer }

export type ForumThread = { post: ForumPost; viewer: ForumViewer }

/** `translated`: its title in the reader's language when written in another (SKATGO-124). */
export type ForumAnnouncement = { id: number; title: string; createdAt: number; translated: { from: string; title: string } | null }

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
 *  hidden one (SKATGO-118: user content is not indexed until the official says so). */
export function postIndexable(p: { section: ForumSection; official: boolean; indexed: boolean; hidden: string | null }): boolean {
  return p.hidden === null && (p.official || p.indexed)
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
//   ![what it shows](name.svg)     a picture, on a line of its own — shown in SkatGo's posts only (SKATGO-129); the file
//                                  is the site's own, `/forum-images/<language>/name.svg`, one per language
// Anything else is a paragraph; a single line break stays a line break.

type ListBlock = { kind: 'ul'; items: string[] } | { kind: 'ol'; items: string[] }
export type ForumBlock =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | ListBlock
  | { kind: 'cards'; cards: Card[] }
  | { kind: 'image'; file: string; alt: string; line: string }

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
/** A picture's line: what it shows, then the file's name. */
const IMAGE = /^!\[([^\]]{1,300})\]\(([a-z0-9-]{1,80}\.(?:svg|png|webp))\)$/
/** Where a picture of SkatGo's posts is, in the page's language (SKATGO-129). */
export const forumImagePath = (file: string, lang: ForumLang) => `/forum-images/${lang}/${file}`

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
    const image = IMAGE.exec(line.trim())
    if (image) {
      flush()
      blocks.push({ kind: 'image', alt: image[1], file: image[2], line: line.trim() })
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
    .map((b) => (b.kind === 'p' ? b.lines.join(' ') : b.kind === 'cards' || b.kind === 'image' ? '' : 'text' in b ? b.text : b.items.join(' ')))
    .join(' ')
    .replace(LINK, (_, label: string | undefined, _href: string | undefined, bare: string | undefined) => label ?? bare ?? '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2))}…`
}
