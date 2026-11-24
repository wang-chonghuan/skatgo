import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { ChevronRight, Eye, EyeOff, Flag, GraduationCap, type LucideIcon, Megaphone, MessageSquare, MessagesSquare, Reply, Trash2 } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'

import {
  COMMENT_MAX, DAILY_LIMITS, FORUM_SECTIONS, POST_MAX, QUERY_MAX, REASON_MAX, TITLE_MAX, TITLE_MIN, type ForumComment,
  type ForumNeighbour, type ForumPost, type ForumPostSummary, type ForumReport, type ForumSection, type ForumSort,
  type ForumViewer, postParam, sectionsFor,
} from '~/lib/forum'
import { track } from '~/lib/analytics'
import { addComment, createPost, deleteOwn, moderate, readReports, report } from '~/lib/forum-api'
import { LANG_TAG } from '~/lib/site'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ForumBody } from './forum-body'
import { Avatar, IconButton, Participants } from './forum-ui'
import { Btn, TextArea, TextField, Toggle, toggleLook } from './ui'

// The forum (SKATGO-118), since SKATGO-231 as plain as it goes and in SkatGo's own colours (the human: 「我希望极简形式的。
// 每个主题，都是一系列列表，然后可以检索和排序（时间， 互动量）。公告列表，讨论列表，高级课程列表。就这三个就行了。列表不要做成卡片。点进列表项
// 后，是图文显示，下面可以评论，点回复时自动at即可」, then 「颜色要丰富一下，还要用skatgo的设计系统」): three lists under one row of
// tabs, each in its section tile's colour, each searchable and sorted by time or by comments, its posts as lines in one
// white panel; a post's page its text and pictures, then its comments, flat, a reply writing "@Name" into the comment
// box. Rendered on the server from the routes' loaders; what changes after a write is read again through the router.

const SECTION_NAME: Record<ForumSection, () => string> = {
  news: m.forum_section_news,
  talk: m.forum_section_talk,
  guides: m.forum_section_guides,
}

/** Each list's mark: its icon on its colour — the front page's tiles: the announcements navy, the discussion green, the
 *  advanced course the course's orange. */
const SECTION_ICON: Record<ForumSection, LucideIcon> = { news: Megaphone, talk: MessagesSquare, guides: GraduationCap }

const SECTION_EMPTY: Record<ForumSection, () => string> = {
  news: m.forum_empty_news,
  talk: m.forum_empty_talk,
  guides: m.forum_empty_guides,
}

const SORT_NAME: Record<ForumSort, () => string> = { new: m.forum_sort_new, active: m.forum_sort_active }

/** A date the same on the server and in the browser: the day, as UTC sees it. */
const dateOf = (ms: number) => new Intl.DateTimeFormat(LANG_TAG[getLocale()], { dateStyle: 'medium', timeZone: 'UTC' }).format(ms)

const nameOf = (of: { official: boolean; author: string }) => (of.official ? m.forum_official() : of.author || m.forum_deleted())

const commentsOf = (n: number) => (n === 1 ? m.forum_comment_one() : m.forum_comment_many({ n }))

function errorText(error: string, kind: 'posts' | 'comments' | 'reports' = 'posts'): string {
  if (error === 'limit_reached') return { posts: m.forum_error_limit_posts, comments: m.forum_error_limit_comments, reports: m.forum_error_limit_reports }[kind]({ n: DAILY_LIMITS[kind] })
  if (error === 'signed_out') return m.forum_error_signed_out()
  return m.forum_error_failed()
}

/** The page was read for whoever the server saw; once the browser knows better (signed in or out since), read
 *  it again, so what the viewer may do is theirs. */
function useViewerSync(viewer: ForumViewer | null) {
  const account = useAccount()
  const router = useRouter()
  useEffect(() => {
    if (viewer && account !== undefined && (account !== null) !== viewer.signedIn) void router.invalidate()
  }, [account, viewer, router])
}

/** The forum's frame: a sub-page's grey, the reading column. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.column)}>{children}</div>
    </div>
  )
}

/** A list's mark: its icon, white on its colour — also SkatGo's mark beside its name, never the logo (the human:
 *  「我发的帖子，都用skatgo的logo，不好看，太重复了」). */
function SectionMark({ section }: { section: ForumSection }) {
  const Icon = SECTION_ICON[section]
  return (
    <span aria-hidden {...stylex.props(styles.mark, styles[section])}>
      <Icon size={icon.small} />
    </span>
  )
}

/** Who wrote a post or comment, beside their name: SkatGo's list's mark, or the player's avatar from their name. */
function AuthorMark({ of, section }: { of: { official: boolean; author: string }; section: ForumSection }) {
  if (of.official || !of.author) return <SectionMark section={section} />
  return <Avatar seed={of.author} small />
}

type View = { section?: ForumSection; q?: string; sort?: ForumSort; page?: number }

/** A list (SKATGO-231): its tabs, its search and order, its posts. */
export function ForumPage() {
  const answer = useLoaderData({ from: '/forum' })
  const { section: chosen, page = 1, q, sort = 'new' } = useSearch({ from: '/forum' })
  const section = chosen ?? FORUM_SECTIONS[0]
  const data = answer.ok ? answer.data : null
  const [writing, setWriting] = useState(false)
  useViewerSync(data?.viewer ?? null)
  // Only what differs from a list's defaults stays in the address; a new view starts on its first page.
  const view = (over: View) => {
    const next: View = { section, q, sort, page: undefined, ...over }
    return {
      section: next.section === FORUM_SECTIONS[0] ? undefined : next.section,
      q: next.q || undefined,
      sort: next.sort === 'new' ? undefined : next.sort,
      page: next.page && next.page > 1 ? next.page : undefined,
    }
  }
  return (
    <Frame>
      <section data-testid="forum" data-section={section} {...stylex.props(styles.stack)}>
        {/* The way to write sits beside the title (the human: 「sign in放在 Forum 的旁边，放个按钮就行」). */}
        <div {...stylex.props(styles.head)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.forum_title()}</h1>
          {data && !writing ? <WriteButton viewer={data.viewer} onWrite={() => setWriting(true)} /> : null}
        </div>
        <nav aria-label={m.forum_sections()} data-testid="forum-sections" {...stylex.props(styles.tabs)}>
          {FORUM_SECTIONS.map((s) => (
            <Link
              key={s}
              to="/forum"
              search={view({ section: s, q: undefined })}
              data-section={s}
              aria-current={s === section ? 'page' : undefined}
              {...stylex.props(s === section ? typography.appBtnStrong : typography.appBtn, styles.tab, s === section && styles.tabCurrent, s === section && styles[`${s}Line`])}
            >
              <SectionMark section={s} />
              {SECTION_NAME[s]()}
            </Link>
          ))}
        </nav>
        {data && writing ? <Composer official={data.viewer.official} initial={section} onCancel={() => setWriting(false)} /> : null}
        {data?.viewer.official ? <Reports /> : null}
        <div {...stylex.props(styles.toolbar)}>
          <SearchBox section={section} sort={sort} q={q} key={`${section}:${q ?? ''}`} />
          <div role="group" aria-label={m.forum_sort()} {...stylex.props(styles.sorts)}>
            {(['new', 'active'] as const).map((s) => (
              <Link key={s} to="/forum" search={view({ sort: s })} data-sort={s} aria-current={s === sort ? 'true' : undefined} {...toggleLook(s === sort)}>
                {SORT_NAME[s]()}
              </Link>
            ))}
          </div>
        </div>
        {!data ? (
          <p {...stylex.props(typography.appText, styles.slate)}>{m.forum_unavailable()}</p>
        ) : data.posts.length === 0 ? (
          <p data-testid="forum-empty" {...stylex.props(typography.appText, styles.slate)}>{q ? m.forum_no_results({ q }) : SECTION_EMPTY[section]()}</p>
        ) : (
          <ol data-testid="forum-list" {...stylex.props(styles.panel, styles.list)}>{data.posts.map((p) => <PostRow key={p.id} post={p} />)}</ol>
        )}
        {data && (page > 1 || data.more) ? (
          <div {...stylex.props(styles.pages)}>
            {page > 1 ? <Link to="/forum" search={view({ page: page - 1 })} {...stylex.props(typography.appLink, styles.link)}>{m.forum_newer()}</Link> : <span />}
            {data.more ? <Link to="/forum" search={view({ page: page + 1 })} {...stylex.props(typography.appLink, styles.link)}>{m.forum_older()}</Link> : null}
          </div>
        ) : null}
        {/* What the forum is for, in small print at the foot (SKATGO-119, the human chose 「摘要+底部小字」). */}
        <p data-testid="forum-about" {...stylex.props(typography.note, styles.slate)}>{m.forum_about()}</p>
      </section>
    </Frame>
  )
}

/** The list's search: a form a browser can send without the page's script — to the page's own address, in its
 *  language — read on the server as any view. */
function SearchBox({ section, sort, q }: { section: ForumSection; sort: ForumSort; q?: string }) {
  const [words, setWords] = useState(q ?? '')
  const navigate = useNavigate()
  const id = useId()
  return (
    <form
      role="search"
      method="get"
      data-testid="forum-search"
      onSubmit={(e) => {
        e.preventDefault()
        const text = words.trim().slice(0, QUERY_MAX)
        void navigate({
          to: '/forum',
          search: { section: section === FORUM_SECTIONS[0] ? undefined : section, q: text || undefined, sort: sort === 'new' ? undefined : sort },
        })
      }}
      {...stylex.props(styles.search)}
    >
      {section === FORUM_SECTIONS[0] ? null : <input type="hidden" name="section" value={section} />}
      {sort === 'new' ? null : <input type="hidden" name="sort" value={sort} />}
      <TextField id={id} name="q" search testId="forum-search-input" value={words} onChange={setWords} placeholder={m.forum_search()} label={m.forum_search()} />
    </form>
  )
}

/** A post in a list, as a line: its author's avatar (a lesson's number), its title, its author and day and a line of
 *  its text; its comments at the right. The title's link covers the row (SKATGO-186, the human: 「手机上，论坛打不开
 *  comments」). */
function PostRow({ post }: { post: ForumPostSummary }) {
  return (
    <li data-testid="forum-post" data-post-id={post.id} data-section={post.section} data-number={post.number ?? undefined} data-comments={post.comments} {...stylex.props(styles.row)}>
      {/* Each post's own picture, from its title as written (the human: 「每个帖子都根据标题自动生成一个这样的图片」). */}
      <Avatar seed={post.title} />
      <div {...stylex.props(styles.rowBody)}>
        <Link to="/forum/$post" params={{ post: postParam(post) }} {...stylex.props(typography.appBtnStrong, styles.rowTitle)}>
          {post.number ? <span {...stylex.props(styles.lessonNo)}>{`${post.number}. `}</span> : null}
          {post.translated?.title ?? post.title}
        </Link>
        <p {...stylex.props(typography.meta, styles.slate, styles.meta)}>
          <span data-testid={post.official ? 'forum-official' : 'forum-author'} {...stylex.props(post.official ? styles.official : styles.author)}>{nameOf(post)}</span>
          <span>{dateOf(post.createdAt)}</span>
        </p>
        {post.excerpt ? <p data-testid="forum-excerpt" {...stylex.props(typography.note, styles.text, styles.excerpt)}>{post.translated?.excerpt ?? post.excerpt}</p> : null}
        {post.hidden !== null ? <p {...stylex.props(typography.small, styles.bad)}>{m.forum_hidden_note({ reason: post.hidden })}</p> : null}
      </div>
      <span {...stylex.props(styles.rowEnd)}>
        <Participants names={post.participants} />
        <span aria-label={commentsOf(post.comments)} {...stylex.props(typography.smallBold, styles.count, post.comments > 0 && styles.countSome)}>
          <MessageSquare size={icon.small} aria-hidden />
          {post.comments}
        </span>
      </span>
    </li>
  )
}

/** The way to write, beside the title: a guest's sign-in, a player's "New post", which opens the composer. */
function WriteButton({ viewer, onWrite }: { viewer: ForumViewer; onWrite: () => void }) {
  if (!viewer.signedIn) {
    return (
      <SignInButton mode="modal">
        <Btn testId="forum-sign-in" onClick={() => track('sign_in_clicked', { at: 'forum_post' })}>{m.auth_sign_in()}</Btn>
      </SignInButton>
    )
  }
  return <Btn testId="forum-new" onClick={onWrite}>{m.forum_new()}</Btn>
}

function Composer({ official, initial, onCancel }: { official: boolean; initial: ForumSection; onCancel: () => void }) {
  const allowed = sectionsFor(official)
  const [section, setSection] = useState<ForumSection>(allowed.includes(initial) ? initial : allowed[0])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const id = useId()
  const publish = async () => {
    const t = title.trim()
    const b = body.trim()
    if (t.length < TITLE_MIN || t.length > TITLE_MAX) return setError(m.forum_error_title())
    if (!b || b.length > POST_MAX) return setError(m.forum_error_body({ max: POST_MAX }))
    setBusy(true)
    const answer = await createPost({ section, title: t, body: b })
    setBusy(false)
    if (!answer.ok) return setError(errorText(answer.error))
    void navigate({ to: '/forum/$post', params: { post: postParam(answer.data) } })
  }
  return (
    <div data-testid="forum-composer" {...stylex.props(styles.panel, styles.padded, styles.form)}>
      <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.forum_new()}</h2>
      {allowed.length > 1 ? (
        <div role="group" aria-label={m.forum_field_section()} {...stylex.props(styles.sorts)}>
          {allowed.map((s) => (
            <Toggle key={s} testId={`forum-section-${s}`} pressed={section === s} onClick={() => setSection(s)}>{SECTION_NAME[s]()}</Toggle>
          ))}
        </div>
      ) : null}
      <label htmlFor={`${id}-title`} {...stylex.props(typography.label, styles.title)}>{m.forum_field_title()}</label>
      <TextField id={`${id}-title`} testId="forum-title" value={title} onChange={setTitle} />
      <label htmlFor={`${id}-body`} {...stylex.props(typography.label, styles.title)}>{m.forum_field_body()}</label>
      <TextArea id={`${id}-body`} testId="forum-body" size="post" value={body} onChange={setBody} />
      <p {...stylex.props(typography.note, styles.slate)}>{m.forum_format_hint()}</p>
      {error ? <p role="alert" {...stylex.props(typography.appText, styles.bad)}>{error}</p> : null}
      <div {...stylex.props(styles.actionsRow)}>
        <Btn testId="forum-publish" disabled={busy} onClick={() => void publish()}>{m.forum_publish()}</Btn>
        <Btn tone="quiet" onClick={onCancel}>{m.forum_cancel()}</Btn>
      </div>
    </div>
  )
}

/** The official's list of open reports: each reported post or comment, hidden with a reason or dismissed. */
function Reports() {
  const [reports, setReports] = useState<ForumReport[] | null>(null)
  const load = useCallback(async () => {
    const answer = await readReports()
    setReports(answer.ok ? answer.data.reports : [])
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  if (!reports?.length) return null
  return (
    <div data-testid="forum-reports" {...stylex.props(styles.panel, styles.padded, styles.form)}>
      <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.forum_reports_title()}</h2>
      {reports.map((r) => <ReportItem key={r.id} report={r} onDone={() => void load()} />)}
    </div>
  )
}

function ReportItem({ report: r, onDone }: { report: ForumReport; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const id = useId()
  const router = useRouter()
  const target = r.commentId !== null ? { comment: r.commentId } : { post: r.postId }
  const act = async (done: Promise<unknown>) => {
    await done
    onDone()
    void router.invalidate()
  }
  return (
    <div data-testid="forum-report" data-post-id={r.postId} data-comment-id={r.commentId ?? undefined} {...stylex.props(styles.report)}>
      <p {...stylex.props(typography.meta, styles.slate)}>
        {[r.commentId !== null ? m.forum_report_on_comment({ title: r.postTitle }) : r.postTitle, m.forum_by({ name: r.author || m.forum_deleted() }), m.forum_report_count({ n: r.count })].join(' · ')}
      </p>
      <p {...stylex.props(typography.appText, styles.text)}>{r.excerpt}</p>
      {r.reasons.length ? <p {...stylex.props(typography.small, styles.slate)}>{r.reasons.map((x) => `„${x}“`).join(' ')}</p> : null}
      <Link to="/forum/$post" params={{ post: postParam({ id: r.postId, title: r.postTitle }) }} {...stylex.props(typography.appLink, styles.link)}>{m.forum_open()}</Link>
      <label htmlFor={`${id}-reason`} {...stylex.props(typography.label, styles.title)}>{m.forum_hide_reason()}</label>
      <div {...stylex.props(styles.actionsRow)}>
        <TextField id={`${id}-reason`} testId="forum-hide-reason" value={reason} onChange={setReason} />
        <Btn tone="quiet" size="sm" testId="forum-hide" disabled={!reason.trim()} onClick={() => void act(moderate({ action: 'hide', reason: reason.trim().slice(0, REASON_MAX), ...target }))}>
          {m.forum_hide()}
        </Btn>
        <Btn tone="quiet" size="sm" testId="forum-dismiss" onClick={() => void act(moderate({ action: 'dismiss', report: r.id }))}>{m.forum_dismiss()}</Btn>
      </div>
    </div>
  )
}

/** One post and its comments (SKATGO-118). */
export function ForumPostPage() {
  const data = useLoaderData({ from: '/forum_/$post' })
  useViewerSync(data.viewer)
  if (!data.post || !data.viewer) {
    return (
      <Frame>
        <section {...stylex.props(styles.stack)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.forum_title()}</h1>
          <p {...stylex.props(typography.appText, styles.slate)}>{m.forum_unavailable()}</p>
          <Link to="/forum" {...stylex.props(typography.appLink, styles.link)}>{`← ${m.forum_title()}`}</Link>
        </section>
      </Frame>
    )
  }
  return <Thread post={data.post} viewer={data.viewer} />
}

/** Who a reply is to: the name the comment box writes as "@Name", and a count, so the same name twice still writes. */
type Mention = { name: string; n: number }

/** A post and its comments, each in the reader's language when written in another (SKATGO-124), with the way to the
 *  text as written under it. */
function Thread({ post, viewer }: { post: ForumPost; viewer: ForumViewer }) {
  const [original, setOriginal] = useState(false)
  const [mention, setMention] = useState<Mention | null>(null)
  const replyTo = (name: string) => setMention((was) => ({ name, n: (was?.n ?? 0) + 1 }))
  const shown = post.translated && !original ? post.translated : null
  return (
    <Frame>
      <article data-testid="forum-thread" data-post-id={post.id} data-section={post.section} data-indexable={post.indexable} {...stylex.props(styles.stack)}>
        <nav aria-label={m.forum_title()} {...stylex.props(typography.appLink, styles.crumbs)}>
          <Link to="/forum" {...stylex.props(styles.link)}>{m.forum_title()}</Link>
          <ChevronRight size={icon.small} aria-hidden {...stylex.props(styles.slate)} />
          <Link to="/forum" search={post.section === FORUM_SECTIONS[0] ? {} : { section: post.section }} {...stylex.props(styles.link, styles.crumbSection)}>
            <SectionMark section={post.section} />
            {SECTION_NAME[post.section]()}
          </Link>
        </nav>
        {/* The post in a white card of its own (the human, SKATGO-118: 「每一个帖子或回复，都放在卡片里」). */}
        <div data-testid="forum-post-card" {...stylex.props(styles.panel, styles.padded, styles.entry)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>
            {post.number ? <span {...stylex.props(styles.lessonNo)}>{`${post.number}. `}</span> : null}
            {shown?.title ?? post.title}
          </h1>
          <Byline of={post} section={post.section} />
          {/* Under the facts, where it is seen before a long text is read. */}
          {post.translated ? <Translated original={original} onSwitch={() => setOriginal(!original)} /> : null}
          {post.hidden !== null ? <p data-testid="forum-hidden" {...stylex.props(typography.appText, styles.bad)}>{m.forum_hidden_note({ reason: post.hidden })}</p> : null}
          <ForumBody text={shown?.body ?? post.body} official={post.official} />
          <Actions viewer={viewer} post={post} onReply={replyTo} />
        </div>
        {post.prev || post.next ? (
          <nav data-testid="forum-lesson-nav" {...stylex.props(typography.appLink, styles.lessonNav)}>
            {post.prev ? <Neighbour to={post.prev} testId="forum-prev" /> : <span />}
            {post.next ? <Neighbour to={post.next} testId="forum-next" end /> : null}
          </nav>
        ) : null}
        <section aria-labelledby="forum-comments" {...stylex.props(styles.comments)}>
          <h2 id="forum-comments" {...stylex.props(typography.optionTitle, styles.title)}>{commentsOf(post.comments)}</h2>
          <div {...stylex.props(styles.panel)}>
            {post.thread.length ? (
              <ol {...stylex.props(styles.list)}>
                {post.thread.map((c) => <CommentRow key={c.id} comment={c} post={post} viewer={viewer} onReply={replyTo} />)}
              </ol>
            ) : null}
            <div {...stylex.props(styles.padded, post.thread.length > 0 && styles.hairlineTop)}>
              <CommentBox viewer={viewer} post={post} mention={mention} />
            </div>
          </div>
        </section>
      </article>
    </Frame>
  )
}

/** The author's mark, name and date over a post or a comment. */
function Byline({ of, section }: { of: ForumPostSummary | ForumComment; section: ForumSection }) {
  return (
    <div {...stylex.props(styles.byline)}>
      <AuthorMark of={of} section={section} />
      <span data-testid={of.official ? 'forum-official' : 'forum-author'} {...stylex.props(typography.smallBold, of.official ? styles.official : styles.author)}>{nameOf(of)}</span>
      <time {...stylex.props(typography.meta, styles.slate)}>{dateOf(of.createdAt)}</time>
    </div>
  )
}

/** A lesson before or after, as a link: "← 1. Title" / "3. Title →". */
function Neighbour({ to, testId, end }: { to: ForumNeighbour; testId: string; end?: boolean }) {
  return (
    <Link to="/forum/$post" params={{ post: postParam(to) }} data-testid={testId} {...stylex.props(styles.link, styles.neighbour, end && styles.neighbourEnd)}>
      {end ? `${to.number}. ${to.title} →` : `← ${to.number}. ${to.title}`}
    </Link>
  )
}

/** A comment, in the reader's language when written in another, the text as written one tap away. */
function CommentRow({ comment: c, post, viewer, onReply }: { comment: ForumComment; post: ForumPost; viewer: ForumViewer; onReply: (name: string) => void }) {
  const [original, setOriginal] = useState(false)
  return (
    <li data-testid="forum-comment" data-comment-id={c.id} {...stylex.props(styles.padded, styles.entry, styles.commentRow)}>
      <Byline of={c} section={post.section} />
      {c.hidden !== null ? <p {...stylex.props(typography.small, styles.bad)}>{m.forum_hidden_note({ reason: c.hidden })}</p> : null}
      <ForumBody text={c.translated && !original ? c.translated.body : c.body} official={c.official} />
      {c.translated ? <Translated original={original} onSwitch={() => setOriginal(!original)} /> : null}
      <Actions viewer={viewer} post={post} comment={c} onReply={onReply} />
    </li>
  )
}

/** That a text is the machine's translation, and a very small link-like button to the text as written and back (the
 *  human: 「用户可以点击查看原文，有个非常小的链接式的小按钮」). */
function Translated({ original, onSwitch }: { original: boolean; onSwitch: () => void }) {
  return (
    <p data-testid="forum-translated" {...stylex.props(typography.micro, styles.translated)}>
      {original ? null : <span>{m.forum_translated()}</span>}
      <button type="button" data-testid="forum-original" onClick={onSwitch} {...stylex.props(typography.micro, styles.originalBtn)}>
        {original ? m.forum_show_translation() : m.forum_show_original()}
      </button>
    </p>
  )
}

/** What the viewer may do with a post or a comment: reply — "@Name" in the comment box (the human: 「点回复时自动at即可」)
 *  — and, as small round icon buttons (the human: 「举报按钮一定要小，目前太大」), report someone else's, delete their own,
 *  and — the official — hide or show it again, and mark a player's post for search engines. A choice opens its reason
 *  or its question under them. */
function Actions({ viewer, post, comment, onReply }: { viewer: ForumViewer; post: ForumPost; comment?: ForumComment; onReply: (name: string) => void }) {
  const item = comment ?? post
  const target = comment ? { comment: comment.id } : { post: post.id }
  const [mode, setMode] = useState<'idle' | 'report' | 'delete' | 'hide' | 'reported'>('idle')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const navigate = useNavigate()
  const id = useId()
  if (!viewer.signedIn) return null
  const run = async (done: Promise<{ ok: boolean; error?: string }>, after: () => void) => {
    const answer = await done
    if (!answer.ok) return setError(errorText((answer as { error: string }).error, mode === 'report' ? 'reports' : 'posts'))
    setError(null)
    after()
  }
  const reload = () => {
    setMode('idle')
    void router.invalidate()
  }
  const toggle = (next: typeof mode) => setMode(mode === next ? 'idle' : next)
  const markable = !comment && !post.official
  // Whom a reply names: SkatGo, or the player's name; a deleted player's writing has none to name.
  const replyName = item.official ? m.forum_official() : item.author
  return (
    <div {...stylex.props(styles.actions)}>
      <div {...stylex.props(styles.actionsRow)}>
        {!item.mine && replyName ? (
          <button type="button" data-testid="forum-reply" onClick={() => onReply(replyName)} {...stylex.props(typography.appLink, styles.reply)}>
            <Reply size={icon.small} aria-hidden />
            {m.forum_reply()}
          </button>
        ) : null}
        {!item.mine ? <IconButton Icon={Flag} label={m.forum_report()} testId="forum-report-open" pressed={mode === 'report'} onClick={() => toggle('report')} /> : null}
        {item.mine ? <IconButton Icon={Trash2} label={m.forum_delete()} testId="forum-delete" pressed={mode === 'delete'} onClick={() => toggle('delete')} /> : null}
        {viewer.official && item.hidden === null ? <IconButton Icon={EyeOff} label={m.forum_hide()} testId="forum-hide-open" pressed={mode === 'hide'} onClick={() => toggle('hide')} /> : null}
        {viewer.official && item.hidden !== null ? (
          <IconButton Icon={Eye} label={m.forum_restore()} testId="forum-restore" onClick={() => void run(moderate({ action: 'restore', ...target }), reload)} />
        ) : null}
        {viewer.official && markable && post.hidden === null ? (
          <Btn tone="quiet" size="sm" testId="forum-index" onClick={() => void run(moderate({ action: post.indexed ? 'unindex' : 'index', post: post.id }), reload)}>
            {post.indexed ? m.forum_unindex() : m.forum_index()}
          </Btn>
        ) : null}
        {mode === 'reported' ? <span {...stylex.props(typography.small, styles.slate)}>{m.forum_reported()}</span> : null}
      </div>
      {mode === 'report' || mode === 'hide' ? (
        <div {...stylex.props(styles.form)}>
          <label htmlFor={`${id}-reason`} {...stylex.props(typography.label, styles.title)}>{mode === 'report' ? m.forum_report_reason() : m.forum_hide_reason()}</label>
          <div {...stylex.props(styles.actionsRow)}>
            <TextField id={`${id}-reason`} testId="forum-reason" value={reason} onChange={setReason} />
            <Btn
              tone="quiet"
              size="sm"
              testId="forum-reason-send"
              disabled={mode === 'hide' && !reason.trim()}
              onClick={() =>
                void (mode === 'report'
                  ? run(report(target, reason.trim().slice(0, REASON_MAX)), () => setMode('reported'))
                  : run(moderate({ action: 'hide', reason: reason.trim().slice(0, REASON_MAX), ...target }), reload))
              }
            >
              {mode === 'report' ? m.forum_report() : m.forum_hide()}
            </Btn>
            <Btn tone="quiet" size="sm" onClick={() => setMode('idle')}>{m.forum_cancel()}</Btn>
          </div>
        </div>
      ) : null}
      {mode === 'delete' ? (
        <div {...stylex.props(styles.actionsRow)}>
          <p {...stylex.props(typography.small, styles.text)}>{m.forum_delete_confirm()}</p>
          <Btn
            tone="stop"
            size="sm"
            testId="forum-delete-yes"
            onClick={() => void run(deleteOwn(target), () => (comment ? reload() : void navigate({ to: '/forum' })))}
          >
            {m.forum_delete_yes()}
          </Btn>
          <Btn tone="quiet" size="sm" onClick={() => setMode('idle')}>{m.forum_cancel()}</Btn>
        </div>
      ) : null}
      {error ? <p role="alert" {...stylex.props(typography.small, styles.bad)}>{error}</p> : null}
    </div>
  )
}

/** The comment box under a post: flat, so no reply to a comment — a reply writes "@Name" here and moves the cursor in. */
function CommentBox({ viewer, post, mention }: { viewer: ForumViewer; post: ForumPost; mention: Mention | null }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const id = useId()
  const box = useRef<HTMLTextAreaElement>(null)
  const replied = useRef(0)
  useEffect(() => {
    if (!mention) return
    const tag = `@${mention.name} `
    setBody((was) => (was.trim() ? `${was.trimEnd()} ${tag}` : tag))
    replied.current = mention.n
  }, [mention])
  useEffect(() => {
    // After a reply wrote its name: the cursor in the box, after the name.
    const area = box.current
    if (!area || !mention || replied.current !== mention.n) return
    replied.current = 0
    area.focus()
    area.setSelectionRange(area.value.length, area.value.length)
    area.scrollIntoView({ block: 'center' })
  }, [body, mention])
  if (!viewer.signedIn) {
    return (
      <div data-testid="forum-sign-in" {...stylex.props(styles.actionsRow)}>
        <p {...stylex.props(typography.appText, styles.slate)}>{m.forum_sign_in_to_comment()}</p>
        <SignInButton mode="modal">
          <Btn size="sm" onClick={() => track('sign_in_clicked', { at: 'forum_comment' })}>{m.auth_sign_in()}</Btn>
        </SignInButton>
      </div>
    )
  }
  const send = async () => {
    const b = body.trim()
    if (!b || b.length > COMMENT_MAX) return setError(m.forum_error_body({ max: COMMENT_MAX }))
    setBusy(true)
    const answer = await addComment(post.id, b)
    setBusy(false)
    if (!answer.ok) return setError(errorText(answer.error, 'comments'))
    setBody('')
    setError(null)
    void router.invalidate()
  }
  return (
    <div data-testid="forum-comment-box" {...stylex.props(styles.form)}>
      <label htmlFor={`${id}-comment`} {...stylex.props(typography.label, styles.title)}>{m.forum_comment_send()}</label>
      <TextArea id={`${id}-comment`} testId="forum-comment-body" size="comment" value={body} onChange={setBody} inputRef={box} />
      {error ? <p role="alert" {...stylex.props(typography.appText, styles.bad)}>{error}</p> : null}
      <div {...stylex.props(styles.actionsRow)}>
        <Btn testId="forum-comment-send" disabled={busy} onClick={() => void send()}>{m.forum_comment_send()}</Btn>
      </div>
    </div>
  )
}

const focusRing = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

const styles = stylex.create({
  // A sub-page on the grey page, in the reading column.
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
    paddingTop: { default: space.x32, [bp.phone]: space.x16 },
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
  },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  title: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  slate: { margin: 0, color: color.slate },
  bad: { margin: 0, color: color.bad },
  head: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.x16 },
  // The three lists as tabs, each with its mark; the current one's line in its own colour.
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: { default: space.x24, [bp.phone]: space.x16 },
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x8,
    paddingBlock: space.x12,
    borderBottomWidth: border.frame,
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    color: { default: color.slate, ':hover': color.navy },
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...focusRing,
  },
  tabCurrent: { color: color.navy },
  newsLine: { borderBottomColor: color.tileNavy },
  talkLine: { borderBottomColor: color.tileGreen },
  guidesLine: { borderBottomColor: color.tileOrange },
  mark: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: dims.badge, height: dims.badge, borderRadius: radii.tag, color: color.onColor },
  news: { backgroundColor: color.tileNavy },
  talk: { backgroundColor: color.tileGreen },
  guides: { backgroundColor: color.tileOrange },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x12 },
  search: { display: 'flex', flexGrow: 1, minWidth: 0, margin: 0 },
  sorts: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  form: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  actions: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  actionsRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  // One white panel; inside it the list's lines under hairlines, never cards of their own (the human: 「列表不要做成卡片」).
  panel: { minWidth: 0, backgroundColor: color.surface, borderRadius: radii.option, boxShadow: elev.option, overflow: 'hidden' },
  padded: { padding: { default: space.x20, [bp.phone]: space.x16 } },
  hairlineTop: { borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  list: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  row: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: space.x12,
    paddingBlock: space.x14,
    paddingInline: { default: space.x20, [bp.phone]: space.x14 },
    borderTopWidth: { default: border.hair, ':first-child': 0 },
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
    backgroundColor: { default: 'transparent', ':hover': color.page },
  },
  rowBody: { display: 'flex', flexDirection: 'column', gap: space.x2, flexGrow: 1, minWidth: 0 },
  rowTitle: {
    color: { default: color.navy, ':hover': color.info },
    textDecoration: 'none',
    overflowWrap: 'anywhere',
    ...focusRing,
    '::after': { content: "''", position: 'absolute', inset: 0 },
  },
  meta: { display: 'flex', flexWrap: 'wrap', columnGap: space.x8 },
  author: { color: color.navy },
  official: { color: color.go },
  excerpt: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowEnd: { display: 'inline-flex', alignItems: 'center', gap: space.x10, flexShrink: 0 },
  count: { display: 'inline-flex', alignItems: 'center', gap: space.x4, flexShrink: 0, color: color.slate },
  countSome: { color: color.info },
  // A post's page.
  crumbs: { display: 'flex', alignItems: 'center', gap: space.x8 },
  crumbSection: { display: 'inline-flex', alignItems: 'center', gap: space.x8 },
  link: { color: color.info, textDecoration: { default: 'none', ':hover': 'underline' }, ...focusRing },
  entry: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  lessonNo: { color: color.tileOrange },
  commentRow: { borderTopWidth: { default: border.hair, ':first-child': 0 }, borderTopStyle: 'solid', borderTopColor: color.hairline },
  byline: { display: 'flex', alignItems: 'center', gap: space.x8 },
  reply: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x6,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: color.info, ':hover': color.navy },
    cursor: 'pointer',
    ...focusRing,
  },
  lessonNav: { display: 'flex', justifyContent: 'space-between', gap: space.x16 },
  neighbour: { minWidth: 0, overflowWrap: 'anywhere' },
  neighbourEnd: { textAlign: 'end' },
  comments: { display: 'flex', flexDirection: 'column', gap: space.x12, paddingTop: space.x8 },
  pages: { display: 'flex', justifyContent: 'space-between', gap: space.x16 },
  report: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x12, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  // The small line under a translated text: quiet words, the button a small link.
  translated: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: space.x8, margin: 0, color: color.slate },
  originalBtn: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    cursor: 'pointer',
    ...focusRing,
  },
})
