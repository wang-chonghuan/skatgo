import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { Avatar } from './forum-ui'
import { Btn } from './ui'
import { squarePicture } from '~/lib/face-image'
import { FILE_TYPES, type ForumMe, type ForumMention, facePath, postParam } from '~/lib/forum'
import { drawNewLook, markSeen, readMe, uploadFace } from '~/lib/forum-api'
import { setUnread } from '~/lib/use-unread'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

/**
 * The account's own at the top of /profile (SKATGO-232): its avatar, as the forum shows it, with a new look a tap away
 * and its own picture to upload (the human: 「每个用户打开profile页面，可以点击，刷新自己的头像。还能上传」, 「上传过还要能重复上传，
 * 还要能刷新。上传过的刷新，要有提示，会移除上传的头像」); under it, the latest times someone named the player with "@" in the
 * forum, each leading to where it was written (「profile里显示最新的at的消息，点了跳转到论坛相应位置」). Seeing them here is
 * seeing them: the count on the header's picture goes.
 */
export function ProfileMe() {
  const [me, setMe] = useState<ForumMe | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<'refused' | 'failed' | null>(null)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => {
    let live = true
    void readMe().then((r) => {
      if (!live || !r.ok) return
      setMe(r.data)
      if (r.data.unread > 0) void markSeen().then((s) => { if (s.ok) setUnread(0) })
      else setUnread(0)
    })
    return () => { live = false }
  }, [])
  if (!me) return null
  const uploaded = me.face !== null && 'image' in me.face

  async function newLook() {
    if (uploaded && !window.confirm(m.profile_face_confirm())) return
    setBusy(true)
    const r = await drawNewLook()
    setBusy(false)
    if (!r.ok) return setProblem('failed')
    setProblem(null)
    setMe((was) => was && { ...was, face: r.data.face })
  }

  async function upload(chosen: File | undefined) {
    if (!chosen) return
    setBusy(true)
    const picture = await squarePicture(chosen)
    if (picture === 'refused') {
      setBusy(false)
      return setProblem('refused')
    }
    const r = await uploadFace(picture)
    setBusy(false)
    if (!r.ok) return setProblem(r.error === 'image_refused' ? 'refused' : 'failed')
    setProblem(null)
    setMe((was) => was && { ...was, face: r.data.face })
  }

  return (
    <>
      <section data-testid="profile-me" {...stylex.props(styles.me)}>
        <Avatar src={facePath(me.face, me.name)} big testId="profile-avatar" />
        <div {...stylex.props(styles.stack)}>
          <p data-testid="profile-name" {...stylex.props(typography.optionTitle, styles.title)}>{me.name}</p>
          <p {...stylex.props(typography.meta, styles.quiet)}>{m.profile_face_note()}</p>
          <div {...stylex.props(styles.actions)}>
            <Btn testId="profile-face-new" tone="quiet" size="md" disabled={busy} onClick={() => void newLook()}>{m.profile_face_new()}</Btn>
            <Btn testId="profile-face-upload" tone="quiet" size="md" disabled={busy} onClick={() => file.current?.click()}>{m.profile_face_upload()}</Btn>
            <input
              ref={file}
              type="file"
              accept={FILE_TYPES.join(',')}
              data-testid="profile-face-file"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                void upload(e.target.files?.[0])
                e.target.value = ''
              }}
              {...stylex.props(styles.file)}
            />
          </div>
          {problem ? (
            <p data-testid="profile-face-problem" data-problem={problem} role="alert" {...stylex.props(typography.small, styles.bad)}>
              {problem === 'refused' ? m.profile_face_refused() : m.profile_face_failed()}
            </p>
          ) : null}
        </div>
      </section>
      {me.mentions.length > 0 ? (
        <section data-testid="profile-mentions" {...stylex.props(styles.stack)}>
          <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_mentions_title()}</h2>
          <ul {...stylex.props(styles.list)}>
            {me.mentions.map((x) => <Mention key={x.id} of={x} />)}
          </ul>
        </section>
      ) : null}
    </>
  )
}

/** One mention: who, in which post, one line of the text and when, leading to the comment — or the post — it is in. */
function Mention({ of }: { of: ForumMention }) {
  const when = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(of.createdAt)
  return (
    <li data-testid="profile-mention" data-unread={of.unread} {...stylex.props(styles.row)}>
      <Link
        to="/forum/$post"
        params={{ post: postParam({ id: of.postId, title: of.postTitle }) }}
        hash={of.commentId === null ? undefined : `comment-${of.commentId}`}
        {...stylex.props(styles.link)}
      >
        {/* SkatGo's mark for SkatGo, as the forum shows it; a deleted player's, the picture of no one. */}
        <Avatar src={of.official ? '/logo-96.png' : facePath(of.face, of.by || m.forum_deleted())} small />
        <span {...stylex.props(styles.body)}>
          <span {...stylex.props(typography.smallBold, styles.line, styles.text)}>
            {m.profile_mention_line({ name: of.official ? m.forum_official() : of.by || m.forum_deleted(), title: of.postTitle })}
          </span>
          <span {...stylex.props(typography.note, styles.line, styles.quiet)}>{of.excerpt}</span>
          <span {...stylex.props(typography.meta, styles.quiet)}>
            {of.unread ? <span data-testid="profile-mention-new" {...stylex.props(typography.smallBold, styles.new)}>{m.profile_mention_new()}</span> : null}
            <time dateTime={new Date(of.createdAt).toISOString()}>{when}</time>
          </span>
        </span>
      </Link>
    </li>
  )
}

const styles = stylex.create({
  me: { display: 'flex', alignItems: 'center', gap: space.x16 },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x8, minWidth: 0 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  title: { margin: 0, color: color.navy },
  text: { color: color.text },
  quiet: { margin: 0, color: color.slate },
  bad: { margin: 0, color: color.bad },
  file: { display: 'none' },
  list: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none', borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  row: { borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  link: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: space.x12,
    paddingBlock: space.x12,
    color: 'inherit',
    textDecoration: 'none',
    backgroundColor: { default: 'transparent', ':hover': color.page },
  },
  body: { display: 'flex', flexDirection: 'column', gap: space.x2, minWidth: 0 },
  line: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  new: { marginInlineEnd: space.x8, color: color.stop },
})
