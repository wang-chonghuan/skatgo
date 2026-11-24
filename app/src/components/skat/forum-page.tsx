import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { BookOpen, ChevronRight, CirclePlay, Eye, EyeOff, Flag, Layers, Megaphone, MessagesSquare, type LucideIcon, SquarePen, Trash2 } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useId, useState } from 'react'

import {
  COMMENT_MAX, DAILY_LIMITS, FORUM_SECTIONS, type ForumLang, POST_MAX, REASON_MAX, TITLE_MAX, TITLE_MIN, type ForumComment, type ForumHome,
  type ForumNeighbour, type ForumPost, type ForumPostSummary, type ForumReport, type ForumSection, type ForumViewer, postParam,
  forumImagePath, sectionsFor,
} from '~/lib/forum'
import { track } from '~/lib/analytics'
import { addComment, createPost, deleteOwn, moderate, readReports, report } from '~/lib/forum-api'
import { LANG_TAG } from '~/lib/site'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { icon } from '../../theme/constants'
import { geist, geistDims, geistShape } from '../../theme/geist.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { ForumBody } from './forum-body'
import { Avatar, GButton, GIconButton, GInput, GPill, GTextArea, gLinkLook, gPillLook } from './forum-ui'

// The forum (SKATGO-118), in the Vercel Community's design since SKATGO-231 (the human: 「论坛要仿照这个风格，最好严格用它的
// 论坛设计系统……用vercel的设计，用我定的简洁结构」): Geist's kit (forum-ui.tsx) and the human's four sections — SkatGo's
// announcements, the players' discussion, SkatGo's guides in order and SkatGo's videos on YouTube. Its home is the
// newest announcements and guides, the videos and the discussion; a section's page lists that section; a post's page
// has its comments, flat, in the order written. All rendered on the server from their routes' loaders; what changes
// after a write is read again through the router.

const SECTION_NAME: Record<ForumSection, () => string> = {
  news: m.forum_section_news,
  talk: m.forum_section_talk,
  guides: m.forum_section_guides,
  videos: m.forum_section_videos,
}

const SECTION_ICON: Record<ForumSection, LucideIcon> = { news: Megaphone, talk: MessagesSquare, guides: BookOpen, videos: CirclePlay }

const SECTION_EMPTY: Record<ForumSection, () => string> = {
  news: m.forum_empty_news,
  talk: m.forum_empty_talk,
  guides: m.forum_empty_guides,
  videos: m.forum_empty_videos,
}

/** A date the same on the server and in the browser: the day, as UTC sees it. */
const dateOf = (ms: number) => new Intl.DateTimeFormat(LANG_TAG[getLocale()], { dateStyle: 'medium', timeZone: 'UTC' }).format(ms)

const commentsOf = (n: number) => (n === 1 ? m.forum_comment_one() : m.forum_comment_many({ n }))

const nameOf = (of: { official: boolean; author: string }) => (of.official ? m.forum_official() : of.author || m.forum_deleted())

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

/** The forum's frame: its navigation beside it, on a phone above it as a row of pills. */
function Frame({ current, children }: { current: ForumSection | 'home'; children: ReactNode }) {
  return (
    <div {...stylex.props(typography.forumFrame, styles.root)}>
      <div {...stylex.props(styles.layout)}>
        <nav aria-label={m.forum_sections()} data-testid="forum-sections" {...stylex.props(styles.nav)}>
          <NavItem to={undefined} Icon={Layers} label={m.forum_title()} current={current === 'home'} />
          {FORUM_SECTIONS.map((s) => <NavItem key={s} to={s} Icon={SECTION_ICON[s]} label={SECTION_NAME[s]()} current={current === s} />)}
        </nav>
        <div {...stylex.props(styles.main)}>{children}</div>
      </div>
    </div>
  )
}

function NavItem({ to, Icon, label, current }: { to: ForumSection | undefined; Icon: LucideIcon; label: string; current: boolean }) {
  return (
    <Link
      to="/forum"
      search={to ? { section: to } : {}}
      data-section={to ?? 'home'}
      aria-current={current ? 'page' : undefined}
      {...stylex.props(typography.forumText, styles.navItem, current && styles.navItemCurrent)}
    >
      <Icon size={icon.forum} aria-hidden {...stylex.props(styles.navIcon, current && styles.navIconCurrent)} />
      {label}
    </Link>
  )
}

/** The list: the forum's home, or one section (SKATGO-231). */
export function ForumPage() {
  const answer = useLoaderData({ from: '/forum' })
  const { section, page = 1 } = useSearch({ from: '/forum' })
  const data = answer.ok ? answer.data : null
  const [writing, setWriting] = useState(false)
  useViewerSync(data?.viewer ?? null)
  const shown: ForumSection = section ?? 'talk'
  return (
    <Frame current={section ?? 'home'}>
      <section data-testid="forum" {...stylex.props(styles.column)}>
        {/* The way to write sits beside the title (the human: 「sign in放在 Forum 的旁边，放个按钮就行」). */}
        <div {...stylex.props(styles.head)}>
          <h1 {...stylex.props(typography.forumDisplay, styles.text)}>{section ? SECTION_NAME[section]() : m.forum_title()}</h1>
          {data && !writing ? <WriteButton viewer={data.viewer} onWrite={() => setWriting(true)} /> : null}
        </div>
        {data && writing ? <Composer official={data.viewer.official} initial={section} onCancel={() => setWriting(false)} /> : null}
        {data?.viewer.official ? <Reports /> : null}
        {!data ? (
          <p {...stylex.props(typography.forumText, styles.secondary)}>{m.forum_unavailable()}</p>
        ) : (
          <>
            {data.home ? <Home home={data.home} /> : null}
            {data.home ? <BlockHead title={SECTION_NAME.talk()} to="talk" /> : null}
            {data.posts.length === 0 ? (
              <p data-testid="forum-empty" {...stylex.props(typography.forumText, styles.secondary)}>{SECTION_EMPTY[shown]()}</p>
            ) : shown === 'guides' ? (
              <ol data-testid="forum-guides" {...stylex.props(styles.list)}>{data.posts.map((p) => <GuideRow key={p.id} post={p} />)}</ol>
            ) : shown === 'videos' ? (
              <ul data-testid="forum-videos" {...stylex.props(styles.videoGrid)}>{data.posts.map((p) => <VideoCard key={p.id} post={p} />)}</ul>
            ) : (
              <ul {...stylex.props(styles.list)}>{data.posts.map((p) => <PostRow key={p.id} post={p} />)}</ul>
            )}
          </>
        )}
        {data && (page > 1 || data.more) ? (
          <div {...stylex.props(styles.pages)}>
            {page > 1 ? <Link to="/forum" search={{ section, page: page > 2 ? page - 1 : undefined }} {...stylex.props(typography.forumName, styles.textLink)}>{m.forum_newer()}</Link> : <span />}
            {data.more ? <Link to="/forum" search={{ section, page: page + 1 }} {...stylex.props(typography.forumName, styles.textLink)}>{m.forum_older()}</Link> : null}
          </div>
        ) : null}
        {/* What the forum is for, in small print at the foot — not under the title (SKATGO-119, the human chose
            「摘要+底部小字」). */}
        <p data-testid="forum-about" {...stylex.props(typography.forumText, styles.secondary, styles.foot)}>{m.forum_about()}</p>
      </section>
    </Frame>
  )
}

/** A block's heading, with its way to the whole section at the right. */
function BlockHead({ title, to }: { title: string; to: ForumSection }) {
  return (
    <div {...stylex.props(styles.blockHead)}>
      <h2 {...stylex.props(typography.forumHeading, styles.text)}>{title}</h2>
      <Link to="/forum" search={{ section: to }} {...stylex.props(typography.forumText, styles.seeAll)}>{`${m.forum_see_all()} →`}</Link>
    </div>
  )
}

/** The home's top: the newest announcement or guide large at the left, the newest of both at the right under the
 *  tabs All / Announcements / Guides; then the videos (SKATGO-231, as the Vercel Community's home). */
function Home({ home }: { home: ForumHome }) {
  const [tab, setTab] = useState<'all' | 'news' | 'guides'>('all')
  const shown = home.featured.filter((p) => tab === 'all' || p.section === tab)
  // The large picture at the left is the newest one that has a picture; without one the list stands alone.
  const lead = home.featured.find((p) => p.cover)
  return (
    <>
      {home.featured.length ? (
        <div data-testid="forum-featured" {...stylex.props(styles.featured, lead && styles.featuredWithLead)}>
          {lead?.cover ? <Lead post={{ ...lead, cover: lead.cover }} /> : null}
          <div {...stylex.props(styles.featuredSide)}>
            <div role="group" aria-label={m.forum_sections()} {...stylex.props(styles.pills)}>
              <GPill testId="forum-tab-all" chosen={tab === 'all'} onClick={() => setTab('all')}>{m.forum_all()}</GPill>
              <GPill testId="forum-tab-news" chosen={tab === 'news'} onClick={() => setTab('news')}>{m.forum_section_news()}</GPill>
              <GPill testId="forum-tab-guides" chosen={tab === 'guides'} onClick={() => setTab('guides')}>{m.forum_section_guides()}</GPill>
            </div>
            <ul {...stylex.props(styles.sideList)}>
              {shown.map((p) => (
                <li key={p.id} data-testid="forum-featured-item" data-section={p.section} {...stylex.props(styles.sideItem)}>
                  <span {...stylex.props(typography.forumText, styles.sideMeta)}>
                    <time {...stylex.props(styles.text)}>{dateOf(p.createdAt)}</time>
                    <span {...stylex.props(styles.secondary)}>{SECTION_NAME[p.section]()}</span>
                  </span>
                  <Link to="/forum/$post" params={{ post: postParam(p) }} {...stylex.props(typography.forumCardTitle, styles.cardTitle)}>{p.translated?.title ?? p.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <BlockHead title={SECTION_NAME.videos()} to="videos" />
      {home.videos.length ? (
        <ul data-testid="forum-videos" {...stylex.props(styles.videoRow)}>{home.videos.map((p) => <VideoCard key={p.id} post={p} />)}</ul>
      ) : (
        <p data-testid="forum-videos-empty" {...stylex.props(typography.forumText, styles.secondary)}>{m.forum_empty_videos()}</p>
      )}
    </>
  )
}

/** The newest announcement or guide with a picture, as that picture. */
function Lead({ post }: { post: ForumPostSummary & { cover: string } }) {
  return (
    <Link to="/forum/$post" params={{ post: postParam(post) }} data-testid="forum-lead" aria-label={post.translated?.title ?? post.title} {...stylex.props(styles.lead)}>
      <img src={forumImagePath(post.cover, getLocale() as ForumLang)} alt="" {...stylex.props(styles.leadPicture)} />
    </Link>
  )
}

/** A post in a list: avatar, name and date, title, two lines of its text and its newest comment (SKATGO-231). The
 *  title's link covers the whole row (SKATGO-186, the human: 「手机上，论坛打不开comments」). */
function PostRow({ post }: { post: ForumPostSummary }) {
  return (
    <li data-testid="forum-post" data-post-id={post.id} data-section={post.section} {...stylex.props(styles.row)}>
      <Avatar name={post.author} official={post.official} />
      <div {...stylex.props(styles.rowBody)}>
        <div {...stylex.props(styles.rowTop)}>
          <span data-testid={post.official ? 'forum-official' : 'forum-author'} {...stylex.props(typography.forumName, styles.text)}>{nameOf(post)}</span>
          <span {...stylex.props(typography.forumText, styles.secondary)}>{`${dateOf(post.createdAt)} · ${commentsOf(post.comments)}`}</span>
        </div>
        <Link to="/forum/$post" params={{ post: postParam(post) }} {...stylex.props(typography.forumRowTitle, styles.rowTitle)}>{post.translated?.title ?? post.title}</Link>
        {post.excerpt ? <p data-testid="forum-excerpt" {...stylex.props(typography.forumText, styles.secondary, styles.excerpt)}>{post.translated?.excerpt ?? post.excerpt}</p> : null}
        {post.last ? (
          <p data-testid="forum-last" {...stylex.props(typography.forumSmall, styles.secondary, styles.last)}>
            <Avatar name={post.last.author} official={post.last.official} size="tiny" />
            <span {...stylex.props(styles.lastText)}>
              <span {...stylex.props(styles.text)}>{nameOf(post.last)}</span> {post.last.excerpt}
            </span>
          </p>
        ) : null}
        {post.hidden !== null ? <p {...stylex.props(typography.forumText, styles.error)}>{m.forum_hidden_note({ reason: post.hidden })}</p> : null}
      </div>
    </li>
  )
}

/** A guide in the guides' list: its number, its picture when it has one, its title and two lines of it. */
function GuideRow({ post }: { post: ForumPostSummary }) {
  return (
    <li data-testid="forum-guide" data-post-id={post.id} data-number={post.number ?? undefined} data-section={post.section} {...stylex.props(styles.row)}>
      {post.cover ? (
        <img src={forumImagePath(post.cover, getLocale() as ForumLang)} alt="" {...stylex.props(styles.guideThumb)} />
      ) : (
        <span aria-hidden {...stylex.props(typography.forumName, styles.guideNumber)}>{post.number}</span>
      )}
      <div {...stylex.props(styles.rowBody)}>
        <span {...stylex.props(typography.forumText, styles.secondary)}>{`${m.forum_guide_number({ n: post.number ?? 0 })} · ${dateOf(post.createdAt)}`}</span>
        <Link to="/forum/$post" params={{ post: postParam(post) }} {...stylex.props(typography.forumRowTitle, styles.rowTitle)}>{post.translated?.title ?? post.title}</Link>
        {post.excerpt ? <p {...stylex.props(typography.forumText, styles.secondary, styles.excerpt)}>{post.translated?.excerpt ?? post.excerpt}</p> : null}
      </div>
    </li>
  )
}

/** A video: its day and "YouTube", its title; it opens on YouTube (the human: 「要链接到youtube上」), or its post when
 *  its text has no YouTube link. */
function VideoCard({ post }: { post: ForumPostSummary }) {
  const title = post.translated?.title ?? post.title
  const inner = (
    <>
      <span {...stylex.props(typography.forumText, styles.videoMeta)}>
        <CirclePlay size={icon.forumSmall} aria-hidden />
        <time {...stylex.props(styles.text)}>{dateOf(post.createdAt)}</time>
        <span {...stylex.props(styles.secondary)}>{m.forum_youtube()}</span>
      </span>
      <span {...stylex.props(typography.forumCardTitle, styles.text)}>{title}</span>
    </>
  )
  return (
    <li data-testid="forum-video" data-post-id={post.id} data-section={post.section} {...stylex.props(styles.videoItem)}>
      {post.video ? (
        <a href={post.video} target="_blank" rel="noopener" {...stylex.props(styles.videoCard)}>{inner}</a>
      ) : (
        <Link to="/forum/$post" params={{ post: postParam(post) }} {...stylex.props(styles.videoCard)}>{inner}</Link>
      )}
    </li>
  )
}

/** The way to write, beside the title: a guest's sign-in, a player's "New post", which opens the composer. */
function WriteButton({ viewer, onWrite }: { viewer: ForumViewer; onWrite: () => void }) {
  if (!viewer.signedIn) {
    return (
      <SignInButton mode="modal">
        <GButton testId="forum-sign-in" onClick={() => track('sign_in_clicked', { at: 'forum_post' })}>{m.auth_sign_in()}</GButton>
      </SignInButton>
    )
  }
  return <GButton testId="forum-new" Icon={SquarePen} onClick={onWrite}>{m.forum_new()}</GButton>
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
    <div data-testid="forum-composer" {...stylex.props(styles.panel, styles.form)}>
      <h2 {...stylex.props(typography.forumHeading, styles.text)}>{m.forum_new()}</h2>
      {allowed.length > 1 ? (
        <div role="group" aria-label={m.forum_field_section()} {...stylex.props(styles.pills)}>
          {allowed.map((s) => (
            <GPill key={s} testId={`forum-section-${s}`} chosen={section === s} onClick={() => setSection(s)}>{SECTION_NAME[s]()}</GPill>
          ))}
        </div>
      ) : null}
      <label htmlFor={`${id}-title`} {...stylex.props(typography.forumName, styles.text)}>{m.forum_field_title()}</label>
      <GInput id={`${id}-title`} testId="forum-title" value={title} onChange={setTitle} />
      <label htmlFor={`${id}-body`} {...stylex.props(typography.forumName, styles.text)}>{m.forum_field_body()}</label>
      <GTextArea id={`${id}-body`} testId="forum-body" size="post" value={body} onChange={setBody} />
      <p {...stylex.props(typography.forumSmall, styles.secondary)}>{m.forum_format_hint()}</p>
      {error ? <p role="alert" {...stylex.props(typography.forumText, styles.error)}>{error}</p> : null}
      <div {...stylex.props(styles.actionsRow)}>
        <GButton testId="forum-publish" disabled={busy} onClick={() => void publish()}>{m.forum_publish()}</GButton>
        <GButton tone="secondary" onClick={onCancel}>{m.forum_cancel()}</GButton>
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
    <div data-testid="forum-reports" {...stylex.props(styles.panel, styles.form)}>
      <h2 {...stylex.props(typography.forumHeading, styles.text)}>{m.forum_reports_title()}</h2>
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
      <p {...stylex.props(typography.forumText, styles.secondary)}>
        {[r.commentId !== null ? m.forum_report_on_comment({ title: r.postTitle }) : r.postTitle, m.forum_by({ name: r.author || m.forum_deleted() }), m.forum_report_count({ n: r.count })].join(' · ')}
      </p>
      <p {...stylex.props(typography.forumText, styles.text)}>{r.excerpt}</p>
      {r.reasons.length ? <p {...stylex.props(typography.forumSmall, styles.secondary)}>{r.reasons.map((x) => `„${x}“`).join(' ')}</p> : null}
      <Link to="/forum/$post" params={{ post: postParam({ id: r.postId, title: r.postTitle }) }} {...stylex.props(typography.forumName, styles.textLink)}>{m.forum_open()}</Link>
      <label htmlFor={`${id}-reason`} {...stylex.props(typography.forumName, styles.text)}>{m.forum_hide_reason()}</label>
      <div {...stylex.props(styles.actionsRow)}>
        <GInput id={`${id}-reason`} testId="forum-hide-reason" value={reason} onChange={setReason} />
        <GButton tone="secondary" testId="forum-hide" disabled={!reason.trim()} onClick={() => void act(moderate({ action: 'hide', reason: reason.trim().slice(0, REASON_MAX), ...target }))}>
          {m.forum_hide()}
        </GButton>
        <GButton tone="secondary" testId="forum-dismiss" onClick={() => void act(moderate({ action: 'dismiss', report: r.id }))}>{m.forum_dismiss()}</GButton>
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
      <Frame current="home">
        <section {...stylex.props(styles.column)}>
          <h1 {...stylex.props(typography.forumDisplay, styles.text)}>{m.forum_title()}</h1>
          <p {...stylex.props(typography.forumText, styles.secondary)}>{m.forum_unavailable()}</p>
          <Link to="/forum" {...stylex.props(typography.forumName, styles.textLink)}>{`← ${m.forum_title()}`}</Link>
        </section>
      </Frame>
    )
  }
  return <Thread post={data.post} viewer={data.viewer} />
}

/** A post and its comments, each in the reader's language when written in another (SKATGO-124), with the way to the
 *  text as written under it. */
function Thread({ post, viewer }: { post: ForumPost; viewer: ForumViewer }) {
  const [original, setOriginal] = useState(false)
  const shown = post.translated && !original ? post.translated : null
  return (
    <Frame current={post.section}>
      <article data-testid="forum-thread" data-post-id={post.id} data-section={post.section} data-indexable={post.indexable} {...stylex.props(styles.column)}>
        <header {...stylex.props(styles.postHead)}>
          <nav aria-label={m.forum_title()} {...stylex.props(typography.forumText, styles.crumbs)}>
            <Link to="/forum" {...stylex.props(styles.crumb)}>{m.forum_title()}</Link>
            <ChevronRight size={icon.forumSmall} aria-hidden {...stylex.props(styles.secondary)} />
            <Link to="/forum" search={{ section: post.section }} {...stylex.props(styles.crumb)}>{SECTION_NAME[post.section]()}</Link>
          </nav>
          <h1 {...stylex.props(typography.forumTitle, styles.text)}>{shown?.title ?? post.title}</h1>
          <p {...stylex.props(typography.forumText, styles.secondary)}>
            {[post.number ? m.forum_guide_number({ n: post.number }) : null, dateOf(post.createdAt), commentsOf(post.comments)].filter(Boolean).join(' · ')}
          </p>
        </header>
        {/* The post as each comment under it: its author's line, its text and what the viewer may do with it. */}
        <div data-testid="forum-post-card" {...stylex.props(styles.entry)}>
          <Byline of={post} />
          {/* Under the facts, where it is seen before a long text is read. */}
          {post.translated ? <Translated original={original} onSwitch={() => setOriginal(!original)} /> : null}
          {post.hidden !== null ? <p data-testid="forum-hidden" {...stylex.props(typography.forumText, styles.error)}>{m.forum_hidden_note({ reason: post.hidden })}</p> : null}
          <ForumBody text={shown?.body ?? post.body} official={post.official} geist />
          {post.video ? (
            <div {...stylex.props(styles.actionsRow)}>
              <a href={post.video} target="_blank" rel="noopener" data-testid="forum-watch" {...gLinkLook()}>
                <CirclePlay size={icon.forum} aria-hidden />
                {m.forum_watch_youtube()}
              </a>
            </div>
          ) : null}
          <Actions viewer={viewer} post={post} />
        </div>
        {post.prev || post.next ? (
          <nav data-testid="forum-guide-nav" {...stylex.props(styles.guideNav)}>
            {post.prev ? <Neighbour to={post.prev} label={m.forum_prev_guide()} testId="forum-prev" /> : <span />}
            {post.next ? <Neighbour to={post.next} label={m.forum_next_guide()} testId="forum-next" end /> : null}
          </nav>
        ) : null}
        <section aria-labelledby="forum-comments" {...stylex.props(styles.comments)}>
          <h2 id="forum-comments" {...stylex.props(typography.forumHeading, styles.text)}>{m.forum_comments_title()}</h2>
          {post.thread.length === 0 ? <p {...stylex.props(typography.forumText, styles.secondary)}>{m.forum_no_comments()}</p> : null}
          {post.thread.length ? (
            <ol {...stylex.props(styles.list)}>
              {post.thread.map((c) => <CommentCard key={c.id} comment={c} post={post} viewer={viewer} />)}
            </ol>
          ) : null}
          <CommentBox viewer={viewer} post={post} />
        </section>
      </article>
    </Frame>
  )
}

/** Avatar, name and date over a post or a comment. */
function Byline({ of }: { of: ForumPostSummary | ForumComment }) {
  return (
    <div {...stylex.props(styles.byline)}>
      <Avatar name={of.author} official={of.official} size="post" />
      <span data-testid={of.official ? 'forum-official' : 'forum-author'} {...stylex.props(typography.forumName, styles.text)}>{nameOf(of)}</span>
      <time {...stylex.props(typography.forumText, styles.secondary)}>{dateOf(of.createdAt)}</time>
    </div>
  )
}

function Neighbour({ to, label, testId, end }: { to: ForumNeighbour; label: string; testId: string; end?: boolean }) {
  return (
    <Link to="/forum/$post" params={{ post: postParam(to) }} data-testid={testId} {...stylex.props(styles.neighbour, end && styles.neighbourEnd)}>
      <span {...stylex.props(typography.forumText, styles.secondary)}>{`${label} · ${m.forum_guide_number({ n: to.number })}`}</span>
      <span {...stylex.props(typography.forumRowTitle, styles.text)}>{to.title}</span>
    </Link>
  )
}

/** A comment, in the reader's language when written in another, the text as written one tap away. */
function CommentCard({ comment: c, post, viewer }: { comment: ForumComment; post: ForumPost; viewer: ForumViewer }) {
  const [original, setOriginal] = useState(false)
  return (
    <li data-testid="forum-comment" data-comment-id={c.id} {...stylex.props(styles.entry, styles.commentEntry)}>
      <Byline of={c} />
      {c.hidden !== null ? <p {...stylex.props(typography.forumText, styles.error)}>{m.forum_hidden_note({ reason: c.hidden })}</p> : null}
      <ForumBody text={c.translated && !original ? c.translated.body : c.body} official={c.official} geist />
      {c.translated ? <Translated original={original} onSwitch={() => setOriginal(!original)} /> : null}
      <Actions viewer={viewer} post={post} comment={c} />
    </li>
  )
}

/** That a text is the machine's translation, and a very small link-like button to the text as written and back (the
 *  human: 「用户可以点击查看原文，有个非常小的链接式的小按钮」). */
function Translated({ original, onSwitch }: { original: boolean; onSwitch: () => void }) {
  return (
    <p data-testid="forum-translated" {...stylex.props(typography.forumSmall, styles.translated)}>
      {original ? null : <span>{m.forum_translated()}</span>}
      <button type="button" data-testid="forum-original" onClick={onSwitch} {...stylex.props(typography.forumSmall, styles.originalBtn)}>
        {original ? m.forum_show_translation() : m.forum_show_original()}
      </button>
    </p>
  )
}

/** What the viewer may do with a post or a comment, as Geist's small icon buttons (SKATGO-231, the human: 「举报按钮一定要小，
 *  目前太大」): report someone else's, delete their own, and — the official — hide or show it again, and mark a
 *  player's post for search engines. A choice opens its reason or its question under them. */
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
  const toggle = (next: typeof mode) => setMode(mode === next ? 'idle' : next)
  const markable = !comment && !post.official
  return (
    <div {...stylex.props(styles.actions)}>
      <div {...stylex.props(styles.iconRow)}>
        {!item.mine ? <GIconButton Icon={Flag} label={m.forum_report()} testId="forum-report-open" pressed={mode === 'report'} onClick={() => toggle('report')} /> : null}
        {item.mine ? <GIconButton Icon={Trash2} label={m.forum_delete()} testId="forum-delete" pressed={mode === 'delete'} onClick={() => toggle('delete')} /> : null}
        {viewer.official && item.hidden === null ? <GIconButton Icon={EyeOff} label={m.forum_hide()} testId="forum-hide-open" pressed={mode === 'hide'} onClick={() => toggle('hide')} /> : null}
        {viewer.official && item.hidden !== null ? (
          <GIconButton Icon={Eye} label={m.forum_restore()} testId="forum-restore" onClick={() => void run(moderate({ action: 'restore', ...target }), reload)} />
        ) : null}
        {viewer.official && markable && post.hidden === null ? (
          <GButton tone="secondary" testId="forum-index" onClick={() => void run(moderate({ action: post.indexed ? 'unindex' : 'index', post: post.id }), reload)}>
            {post.indexed ? m.forum_unindex() : m.forum_index()}
          </GButton>
        ) : null}
        {mode === 'reported' ? <span {...stylex.props(typography.forumText, styles.secondary)}>{m.forum_reported()}</span> : null}
      </div>
      {mode === 'report' || mode === 'hide' ? (
        <div {...stylex.props(styles.form)}>
          <label htmlFor={`${id}-reason`} {...stylex.props(typography.forumName, styles.text)}>{mode === 'report' ? m.forum_report_reason() : m.forum_hide_reason()}</label>
          <div {...stylex.props(styles.actionsRow)}>
            <GInput id={`${id}-reason`} testId="forum-reason" value={reason} onChange={setReason} />
            <GButton
              tone="secondary"
              testId="forum-reason-send"
              disabled={mode === 'hide' && !reason.trim()}
              onClick={() =>
                void (mode === 'report'
                  ? run(report(target, reason.trim().slice(0, REASON_MAX)), () => setMode('reported'))
                  : run(moderate({ action: 'hide', reason: reason.trim().slice(0, REASON_MAX), ...target }), reload))
              }
            >
              {mode === 'report' ? m.forum_report() : m.forum_hide()}
            </GButton>
            <GButton tone="secondary" onClick={() => setMode('idle')}>{m.forum_cancel()}</GButton>
          </div>
        </div>
      ) : null}
      {mode === 'delete' ? (
        <div {...stylex.props(styles.actionsRow)}>
          <p {...stylex.props(typography.forumText, styles.text)}>{m.forum_delete_confirm()}</p>
          <GButton
            tone="destructive"
            testId="forum-delete-yes"
            onClick={() => void run(deleteOwn(target), () => (comment ? reload() : void navigate({ to: '/forum' })))}
          >
            {m.forum_delete_yes()}
          </GButton>
          <GButton tone="secondary" onClick={() => setMode('idle')}>{m.forum_cancel()}</GButton>
        </div>
      ) : null}
      {error ? <p role="alert" {...stylex.props(typography.forumText, styles.error)}>{error}</p> : null}
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
      <div data-testid="forum-sign-in" {...stylex.props(styles.actionsRow)}>
        <p {...stylex.props(typography.forumText, styles.secondary)}>{m.forum_sign_in_to_comment()}</p>
        <SignInButton mode="modal">
          <GButton onClick={() => track('sign_in_clicked', { at: 'forum_comment' })}>{m.auth_sign_in()}</GButton>
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
      <label htmlFor={`${id}-comment`} {...stylex.props(typography.forumName, styles.text)}>{m.forum_comment_send()}</label>
      <GTextArea id={`${id}-comment`} testId="forum-comment-body" size="comment" value={body} onChange={setBody} />
      <p {...stylex.props(typography.forumSmall, styles.secondary)}>{m.forum_mention_hint()}</p>
      {error ? <p role="alert" {...stylex.props(typography.forumText, styles.error)}>{error}</p> : null}
      <div {...stylex.props(styles.actionsRow)}>
        <GButton testId="forum-comment-send" disabled={busy} onClick={() => void send()}>{m.forum_comment_send()}</GButton>
      </div>
    </div>
  )
}

const focusRing = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focusSm,
  outlineColor: geist.focus,
  outlineOffset: border.focusSm,
} as const

const styles = stylex.create({
  // The forum on Geist's white, its navigation beside its column (on a phone and a narrow screen above it).
  root: { display: 'flex', flexDirection: 'column', flexGrow: 1, color: geist.text, backgroundColor: geist.background },
  layout: {
    display: 'grid',
    gridTemplateColumns: { default: geistDims.layoutColumns, [bp.cards]: geistDims.oneColumn },
    justifyContent: 'center',
    columnGap: space.x24,
    width: '100%',
    boxSizing: 'border-box',
    paddingInline: { default: space.x24, [bp.phone]: space.x16 },
  },
  nav: {
    display: 'flex',
    flexDirection: { default: 'column', [bp.cards]: 'row' },
    gap: space.x2,
    alignSelf: 'start',
    position: { default: 'sticky', [bp.cards]: 'static' },
    top: space.x16,
    paddingBlock: { default: space.x32, [bp.cards]: space.x16 },
    overflowX: { default: 'visible', [bp.cards]: 'auto' },
    scrollbarWidth: 'none',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x8,
    flexShrink: 0,
    padding: space.x8,
    borderRadius: geistShape.control,
    color: { default: geist.secondary, ':hover': geist.text },
    backgroundColor: { default: 'transparent', ':hover': geist.fill },
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...focusRing,
  },
  navItemCurrent: { color: geist.text, backgroundColor: geist.fill },
  navIcon: { flexShrink: 0, color: geist.muted },
  navIconCurrent: { color: geist.text },
  main: { minWidth: 0 },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.cards]: space.x8 },
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
  },
  text: { margin: 0, color: geist.text },
  secondary: { margin: 0, color: geist.secondary },
  error: { margin: 0, color: geist.error },
  foot: { paddingTop: space.x16, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: geist.hairline },
  head: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.x16 },
  pills: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  form: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  actionsRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  panel: {
    padding: space.x20,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: geist.hairline,
    borderRadius: geistShape.card,
    backgroundColor: geist.backgroundSoft,
  },
  report: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x12, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: geist.hairline },
  textLink: { color: geist.text, textDecoration: { default: 'none', ':hover': 'underline' }, borderRadius: geistShape.control, ...focusRing },
  // The home's top block, as the Vercel Community's: the lead picture, and the newest beside it under its tabs.
  featured: { display: 'grid', gridTemplateColumns: geistDims.oneColumn, gap: space.x32 },
  featuredWithLead: { gridTemplateColumns: { default: geistDims.featuredColumns, [bp.cards]: geistDims.oneColumn } },
  // SkatGo's pictures are drawings and charts with words in them: shown whole on white in a hairline frame, never cut.
  lead: {
    display: 'block',
    aspectRatio: geistDims.featuredRatio,
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: geist.hairline,
    borderRadius: geistShape.card,
    backgroundColor: geist.background,
    textDecoration: 'none',
    ...focusRing,
  },
  leadPicture: { display: 'block', width: '100%', height: '100%', objectFit: 'contain' },
  featuredSide: { display: 'flex', flexDirection: 'column', gap: space.x20, minWidth: 0 },
  sideList: { display: 'flex', flexDirection: 'column', gap: space.x20, margin: 0, padding: 0, listStyle: 'none' },
  sideItem: { display: 'flex', flexDirection: 'column', gap: space.x4, minWidth: 0 },
  sideMeta: { display: 'flex', gap: space.x8 },
  cardTitle: { color: geist.text, textDecoration: { default: 'none', ':hover': 'underline' }, overflowWrap: 'anywhere', borderRadius: geistShape.control, ...focusRing },
  blockHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x16, paddingTop: space.x16 },
  seeAll: { flexShrink: 0, color: { default: geist.secondary, ':hover': geist.text }, textDecoration: 'none', borderRadius: geistShape.control, ...focusRing },
  // Videos: a row of text cards on the home, a grid on their section's page.
  videoRow: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: { default: geistDims.oneColumn, [bp.phone]: geistDims.videoCard },
    gap: space.x16,
    marginBlock: 0,
    marginInline: geistDims.videoInset,
    padding: 0,
    listStyle: 'none',
    overflowX: 'auto',
  },
  videoGrid: { display: 'grid', gridTemplateColumns: geistDims.videoGrid, gap: space.x16, marginBlock: 0, marginInline: geistDims.videoInset, padding: 0, listStyle: 'none' },
  videoItem: { display: 'flex', minWidth: 0 },
  videoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    flexGrow: 1,
    padding: space.x16,
    borderRadius: geistShape.card,
    color: geist.text,
    backgroundColor: { default: 'transparent', ':hover': geist.fill },
    textDecoration: 'none',
    ...focusRing,
  },
  videoMeta: { display: 'flex', alignItems: 'center', gap: space.x8, color: geist.text },
  // A row of a list: the avatar (or a guide's number or picture) and the text beside it.
  list: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, padding: 0, listStyle: 'none' },
  row: { position: 'relative', display: 'flex', alignItems: 'flex-start', gap: space.x12, paddingBlock: space.x12 },
  rowBody: { display: 'flex', flexDirection: 'column', gap: space.x4, flexGrow: 1, minWidth: 0 },
  rowTop: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: space.x12 },
  rowTitle: {
    color: geist.text,
    textDecoration: { default: 'none', ':hover': 'underline' },
    overflowWrap: 'anywhere',
    borderRadius: geistShape.control,
    ...focusRing,
    '::after': { content: "''", position: 'absolute', inset: 0 },
  },
  excerpt: { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: geistDims.excerptLines, overflow: 'hidden', overflowWrap: 'anywhere' },
  last: { display: 'flex', alignItems: 'center', gap: space.x8, minWidth: 0, paddingTop: space.x4 },
  lastText: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  guideNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: geistDims.avatar,
    height: geistDims.avatar,
    borderRadius: geistShape.card,
    color: geist.text,
    backgroundColor: geist.fill,
  },
  guideThumb: {
    flexShrink: 0,
    boxSizing: 'border-box',
    width: geistDims.guideThumb,
    aspectRatio: geistDims.featuredRatio,
    objectFit: 'contain',
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: geist.hairline,
    borderRadius: geistShape.card,
    backgroundColor: geist.background,
  },
  // A post's page.
  postHead: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingBottom: space.x20,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: geist.hairline,
  },
  crumbs: { display: 'flex', alignItems: 'center', gap: space.x8, color: geist.secondary },
  crumb: { color: { default: geist.secondary, ':hover': geist.text }, textDecoration: 'none', borderRadius: geistShape.control, ...focusRing },
  entry: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  commentEntry: { paddingBlock: space.x16, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: geist.hairline },
  byline: { display: 'flex', alignItems: 'center', gap: space.x8 },
  actions: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  iconRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  guideNav: { display: 'grid', gridTemplateColumns: { default: geistDims.twoColumns, [bp.phone]: geistDims.oneColumn }, gap: space.x16 },
  neighbour: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x4,
    padding: space.x16,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: { default: geist.hairline, ':hover': geist.muted },
    borderRadius: geistShape.card,
    textDecoration: 'none',
    ...focusRing,
  },
  neighbourEnd: { textAlign: 'end' },
  comments: { display: 'flex', flexDirection: 'column', gap: space.x12, paddingTop: space.x8 },
  pages: { display: 'flex', justifyContent: 'space-between', gap: space.x16 },
  // The small line under a translated text: quiet words, the button a small link.
  translated: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: space.x8, margin: 0, color: geist.secondary },
  originalBtn: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: geist.text,
    textDecoration: { default: 'underline', ':hover': 'none' },
    cursor: 'pointer',
    ...focusRing,
  },
})

