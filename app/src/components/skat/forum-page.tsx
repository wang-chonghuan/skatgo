import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useId, useState } from 'react'

import {
  COMMENT_MAX, DAILY_LIMITS, FORUM_SECTIONS, POST_MAX, REASON_MAX, TITLE_MAX, TITLE_MIN, type ForumComment, type ForumPost,
  type ForumPostSummary, type ForumReport, type ForumSection, type ForumViewer, postParam, sectionsFor,
} from '~/lib/forum'
import { addComment, createPost, deleteOwn, moderate, readReports, report } from '~/lib/forum-api'
import { LANG_TAG } from '~/lib/site'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ForumBody } from './forum-body'
import { Btn, Panel, TextArea, TextField, Toggle, toggleLook } from './ui'

// The forum (SKATGO-118): the list of a language's posts with its sections, the composer and, for the official, the
// open reports; and one post with its comments, flat, in the order written. Both are rendered on the server from
// their routes' loaders; what changes after a write is read again through the router.

const SECTION_NAME: Record<ForumSection, () => string> = {
  news: m.forum_section_news,
  articles: m.forum_section_articles,
  talk: m.forum_section_talk,
  feedback: m.forum_section_feedback,
}

/** A date the same on the server and in the browser: the day, as UTC sees it. */
const dateOf = (ms: number) => new Intl.DateTimeFormat(LANG_TAG[getLocale()], { dateStyle: 'medium', timeZone: 'UTC' }).format(ms)

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

/** The list (SKATGO-118). */
export function ForumPage() {
  const answer = useLoaderData({ from: '/forum' })
  const { section, page = 1 } = useSearch({ from: '/forum' })
  const data = answer.ok ? answer.data : null
  const [writing, setWriting] = useState(false)
  useViewerSync(data?.viewer ?? null)
  return (
    <div {...stylex.props(styles.root)}>
      <section data-testid="forum" {...stylex.props(styles.column)}>
        {/* The way to write sits beside the title (the human: 「sign in放在 Forum 的旁边，放个按钮就行」). */}
        <div {...stylex.props(styles.head)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.forum_title()}</h1>
          {data && !writing ? <WriteButton viewer={data.viewer} onWrite={() => setWriting(true)} /> : null}
        </div>
        {data && writing ? <Composer official={data.viewer.official} initial={section} onCancel={() => setWriting(false)} /> : null}
        {data?.viewer.official ? <Reports /> : null}
        <nav aria-label={m.forum_sections()} data-testid="forum-sections" {...stylex.props(styles.pills)}>
          <Link to="/forum" search={{}} aria-current={section ? undefined : 'page'} {...toggleLook(!section)}>{m.forum_all()}</Link>
          {FORUM_SECTIONS.map((s) => (
            <Link key={s} to="/forum" search={{ section: s }} data-section={s} aria-current={section === s ? 'page' : undefined} {...toggleLook(section === s)}>
              {SECTION_NAME[s]()}
            </Link>
          ))}
        </nav>
        {!section || section === 'articles' ? (
          <Link to="/skat-tricks/12-tricks" data-testid="forum-tricks-article" {...stylex.props(typography.appLink, styles.link)}>{m.forum_tricks_link()}</Link>
        ) : null}
        {!data ? (
          <p {...stylex.props(typography.appText, styles.note)}>{m.forum_unavailable()}</p>
        ) : data.posts.length === 0 ? (
          <p data-testid="forum-empty" {...stylex.props(typography.appText, styles.note)}>{m.forum_empty()}</p>
        ) : (
          <ul {...stylex.props(styles.list)}>
            {data.posts.map((p) => <PostCard key={p.id} post={p} />)}
          </ul>
        )}
        {data && (page > 1 || data.more) ? (
          <div {...stylex.props(styles.pages)}>
            {page > 1 ? <Link to="/forum" search={{ section, page: page > 2 ? page - 1 : undefined }} {...stylex.props(typography.appLink, styles.link)}>{m.forum_newer()}</Link> : <span />}
            {data.more ? <Link to="/forum" search={{ section, page: page + 1 }} {...stylex.props(typography.appLink, styles.link)}>{m.forum_older()}</Link> : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function PostCard({ post }: { post: ForumPostSummary }) {
  return (
    <li data-testid="forum-post" data-post-id={post.id} data-section={post.section} {...stylex.props(styles.card)}>
      <Link to="/forum/$post" params={{ post: postParam(post) }} {...stylex.props(typography.optionDesc, styles.cardTitle)}>{post.title}</Link>
      <Meta of={post} />
      {post.hidden !== null ? <p {...stylex.props(typography.small, styles.hidden)}>{m.forum_hidden_note({ reason: post.hidden })}</p> : null}
    </li>
  )
}

/** Section, author (with the official's tag), date and, for a post, its comments. */
function Meta({ of }: { of: ForumPostSummary | ForumComment }) {
  const post = 'section' in of ? of : null
  return (
    <div {...stylex.props(styles.meta)}>
      {post ? <span {...stylex.props(typography.meta, styles.quiet)}>{post.section === 'news' ? m.forum_announcement() : SECTION_NAME[post.section]()}</span> : null}
      {/* The official writes as SkatGo, not under a player's name. */}
      {of.official ? (
        <span data-testid="forum-official" {...stylex.props(typography.smallBold, styles.official)}>{m.forum_official()}</span>
      ) : (
        <span data-testid="forum-author" {...stylex.props(typography.meta, styles.author)}>{of.author}</span>
      )}
      <span {...stylex.props(typography.meta, styles.quiet)}>{dateOf(of.createdAt)}</span>
      {post ? (
        <span {...stylex.props(typography.meta, styles.quiet)}>{post.comments === 1 ? m.forum_comment_one() : m.forum_comment_many({ n: post.comments })}</span>
      ) : null}
    </div>
  )
}

/** The way to write, beside the title: a guest's sign-in, a player's "Neuer Beitrag", which opens the composer. */
function WriteButton({ viewer, onWrite }: { viewer: ForumViewer; onWrite: () => void }) {
  if (!viewer.signedIn) {
    return (
      <SignInButton mode="modal">
        <Btn testId="forum-sign-in">{m.auth_sign_in()}</Btn>
      </SignInButton>
    )
  }
  return <Btn testId="forum-new" onClick={onWrite}>{m.forum_new()}</Btn>
}

function Composer({ official, initial, onCancel }: { official: boolean; initial?: ForumSection; onCancel: () => void }) {
  const allowed = sectionsFor(official)
  const [section, setSection] = useState<ForumSection>(initial && allowed.includes(initial) ? initial : official ? 'news' : 'talk')
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
    <Panel>
      <div data-testid="forum-composer" {...stylex.props(styles.form)}>
        <h2 {...stylex.props(typography.dialogTitle, styles.title)}>{m.forum_new()}</h2>
        <div role="group" aria-label={m.forum_field_section()} {...stylex.props(styles.pills)}>
          {allowed.map((s) => (
            <Toggle key={s} testId={`forum-section-${s}`} pressed={section === s} onClick={() => setSection(s)}>{SECTION_NAME[s]()}</Toggle>
          ))}
        </div>
        <label htmlFor={`${id}-title`} {...stylex.props(typography.label, styles.label)}>{m.forum_field_title()}</label>
        <TextField id={`${id}-title`} testId="forum-title" value={title} onChange={setTitle} />
        <label htmlFor={`${id}-body`} {...stylex.props(typography.label, styles.label)}>{m.forum_field_body()}</label>
        <TextArea id={`${id}-body`} testId="forum-body" size="post" value={body} onChange={setBody} />
        <p {...stylex.props(typography.note, styles.quiet)}>{m.forum_format_hint()}</p>
        {error ? <p role="alert" {...stylex.props(typography.appText, styles.error)}>{error}</p> : null}
        <div {...stylex.props(styles.row)}>
          <Btn testId="forum-publish" disabled={busy} onClick={() => void publish()}>{m.forum_publish()}</Btn>
          <Btn tone="quiet" onClick={onCancel}>{m.forum_cancel()}</Btn>
        </div>
      </div>
    </Panel>
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
    <Panel tone="tip">
      <div data-testid="forum-reports" {...stylex.props(styles.form)}>
        <h2 {...stylex.props(typography.dialogTitle, styles.title)}>{m.forum_reports_title()}</h2>
        {reports.map((r) => <ReportItem key={r.id} report={r} onDone={() => void load()} />)}
      </div>
    </Panel>
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
      <p {...stylex.props(typography.meta, styles.quiet)}>
        {[r.commentId !== null ? m.forum_report_on_comment({ title: r.postTitle }) : r.postTitle, m.forum_by({ name: r.author }), m.forum_report_count({ n: r.count })].join(' · ')}
      </p>
      <p {...stylex.props(typography.appText, styles.note)}>{r.excerpt}</p>
      {r.reasons.length ? <p {...stylex.props(typography.small, styles.quiet)}>{r.reasons.map((x) => `„${x}“`).join(' ')}</p> : null}
      <Link to="/forum/$post" params={{ post: postParam({ id: r.postId, title: r.postTitle }) }} {...stylex.props(typography.appLink, styles.link)}>{m.forum_open()}</Link>
      <label htmlFor={`${id}-reason`} {...stylex.props(typography.label, styles.label)}>{m.forum_hide_reason()}</label>
      <div {...stylex.props(styles.row)}>
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
      <div {...stylex.props(styles.root)}>
        <section {...stylex.props(styles.column)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.forum_title()}</h1>
          <p {...stylex.props(typography.appText, styles.note)}>{m.forum_unavailable()}</p>
          <Link to="/forum" {...stylex.props(typography.appLink, styles.link)}>{`← ${m.forum_back()}`}</Link>
        </section>
      </div>
    )
  }
  const { post, viewer } = data
  return (
    <div {...stylex.props(styles.root)}>
      <article data-testid="forum-thread" data-post-id={post.id} data-indexable={post.indexable} {...stylex.props(styles.column)}>
        <nav aria-label={m.forum_title()} {...stylex.props(styles.row)}>
          <Link to="/forum" {...stylex.props(typography.appLink, styles.link)}>{`← ${m.forum_back()}`}</Link>
          <Link to="/forum" search={{ section: post.section }} {...stylex.props(typography.appLink, styles.link)}>{SECTION_NAME[post.section]()}</Link>
        </nav>
        {/* The post in a card of its own, as each comment under it (the human: 「每一个帖子或回复，都放在卡片里」). */}
        <div data-testid="forum-post-card" {...stylex.props(styles.card, styles.postCard)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>{post.title}</h1>
          <Meta of={post} />
          {post.hidden !== null ? <Panel tone="bad"><p data-testid="forum-hidden" {...stylex.props(typography.appText, styles.note)}>{m.forum_hidden_note({ reason: post.hidden })}</p></Panel> : null}
          <ForumBody text={post.body} official={post.official} />
          <Actions viewer={viewer} post={post} />
        </div>
        <section aria-labelledby="forum-comments" {...stylex.props(styles.comments)}>
          <h2 id="forum-comments" {...stylex.props(typography.optionDesc, styles.title)}>{m.forum_comments_title()}</h2>
          {post.thread.length === 0 ? <p {...stylex.props(typography.appText, styles.quiet)}>{m.forum_no_comments()}</p> : null}
          {post.thread.length ? (
            <ol {...stylex.props(styles.list)}>
              {post.thread.map((c) => (
                <li key={c.id} data-testid="forum-comment" data-comment-id={c.id} {...stylex.props(styles.card)}>
                  <Meta of={c} />
                  {c.hidden !== null ? <p {...stylex.props(typography.small, styles.hidden)}>{m.forum_hidden_note({ reason: c.hidden })}</p> : null}
                  <ForumBody text={c.body} official={c.official} />
                  <Actions viewer={viewer} post={post} comment={c} />
                </li>
              ))}
            </ol>
          ) : null}
          <CommentBox viewer={viewer} post={post} />
        </section>
      </article>
    </div>
  )
}

/** What the viewer may do with a post or a comment: report someone else's, delete their own, and — the official —
 *  hide or show it again, and mark a player's post for search engines. */
function Actions({ viewer, post, comment }: { viewer: ForumViewer; post: ForumPost; comment?: ForumComment }) {
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
  const markable = !comment && !post.official && post.section !== 'feedback'
  return (
    <div {...stylex.props(styles.actions)}>
      {mode === 'idle' ? (
        <div {...stylex.props(styles.row)}>
          {!item.mine ? <Btn tone="quiet" size="sm" testId="forum-report-open" onClick={() => setMode('report')}>{m.forum_report()}</Btn> : null}
          {item.mine ? <Btn tone="quiet" size="sm" testId="forum-delete" onClick={() => setMode('delete')}>{m.forum_delete()}</Btn> : null}
          {viewer.official && item.hidden === null ? <Btn tone="quiet" size="sm" testId="forum-hide-open" onClick={() => setMode('hide')}>{m.forum_hide()}</Btn> : null}
          {viewer.official && item.hidden !== null ? (
            <Btn tone="quiet" size="sm" testId="forum-restore" onClick={() => void run(moderate({ action: 'restore', ...target }), reload)}>{m.forum_restore()}</Btn>
          ) : null}
          {viewer.official && markable && post.hidden === null ? (
            <Btn tone="quiet" size="sm" testId="forum-index" onClick={() => void run(moderate({ action: post.indexed ? 'unindex' : 'index', post: post.id }), reload)}>
              {post.indexed ? m.forum_unindex() : m.forum_index()}
            </Btn>
          ) : null}
          {viewer.official && markable && post.indexed && post.hidden === null ? <span {...stylex.props(typography.meta, styles.quiet)}>{m.forum_indexed()}</span> : null}
        </div>
      ) : null}
      {mode === 'reported' ? <p {...stylex.props(typography.small, styles.quiet)}>{m.forum_reported()}</p> : null}
      {mode === 'report' || mode === 'hide' ? (
        <>
          <label htmlFor={`${id}-reason`} {...stylex.props(typography.label, styles.label)}>{mode === 'report' ? m.forum_report_reason() : m.forum_hide_reason()}</label>
          <div {...stylex.props(styles.row)}>
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
        </>
      ) : null}
      {mode === 'delete' ? (
        <div {...stylex.props(styles.row)}>
          <p {...stylex.props(typography.small, styles.note)}>{m.forum_delete_confirm()}</p>
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
      {error ? <p role="alert" {...stylex.props(typography.small, styles.error)}>{error}</p> : null}
    </div>
  )
}

/** The comment box under a post: flat, so no reply to a comment — "@Name" says whom one means. */
function CommentBox({ viewer, post }: { viewer: ForumViewer; post: ForumPost }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const id = useId()
  if (!viewer.signedIn) {
    return (
      <div data-testid="forum-sign-in" {...stylex.props(styles.row)}>
        <p {...stylex.props(typography.appText, styles.note)}>{m.forum_sign_in_to_comment()}</p>
        <SignInButton mode="modal">
          <Btn size="sm">{m.auth_sign_in()}</Btn>
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
      <label htmlFor={`${id}-comment`} {...stylex.props(typography.label, styles.label)}>{m.forum_comment_send()}</label>
      <TextArea id={`${id}-comment`} testId="forum-comment-body" size="comment" value={body} onChange={setBody} />
      <p {...stylex.props(typography.note, styles.quiet)}>{m.forum_mention_hint()}</p>
      {error ? <p role="alert" {...stylex.props(typography.appText, styles.error)}>{error}</p> : null}
      <div {...stylex.props(styles.row)}>
        <Btn testId="forum-comment-send" disabled={busy} onClick={() => void send()}>{m.forum_comment_send()}</Btn>
      </div>
    </div>
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
  head: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x16 },
  note: { margin: 0, color: color.text },
  quiet: { margin: 0, color: color.slate },
  error: { margin: 0, color: color.bad },
  hidden: { margin: 0, color: color.bad },
  label: { color: color.navy },
  pills: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x12 },
  form: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  list: { display: 'flex', flexDirection: 'column', gap: space.x12, margin: 0, padding: 0, listStyle: 'none' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    minWidth: 0,
    padding: { default: space.x20, [bp.phone]: space.x16 },
    backgroundColor: color.surface,
    borderRadius: radii.option,
    boxShadow: elev.option,
  },
  cardTitle: {
    color: { default: color.navy, ':hover': color.info },
    textDecoration: 'none',
    overflowWrap: 'anywhere',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  postCard: { gap: space.x16 },
  meta: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: space.x12, rowGap: space.x4 },
  author: { color: color.navy },
  official: { color: color.go },
  report: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingTop: space.x12,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  actions: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  comments: { display: 'flex', flexDirection: 'column', gap: space.x12, paddingTop: space.x16 },
  pages: { display: 'flex', justifyContent: 'space-between', gap: space.x16 },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
