import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { Pill, ProgressBar, Stars, linkLook } from './ui'
import { LESSONS, isUnlocked } from '~/lib/skat/lessons/content'
import { useProgress } from '~/lib/skat/progress'
import { skat } from '../../theme/skat.stylex'

/** The course map: every lesson with its state, overall progress, and the way into free play. */
export function CourseHome() {
  const done = useProgress((s) => s.done)
  const tally = useProgress((s) => s.tally)
  const finished = LESSONS.filter((l) => l.id in done).length
  const pct = Math.round((finished / LESSONS.length) * 100)
  const current = LESSONS.find((l) => !(l.id in done))
  const totalMinutes = LESSONS.reduce((n, l) => n + l.minutes, 0)

  return (
    <div data-testid="skat-home" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.heroText)}>
          <h1 {...stylex.props(styles.h1)}>一小时，学会斯卡特</h1>
          <p {...stylex.props(styles.lead)}>
            德国的国民牌戏：三个人、32 张牌、每局一打二。{LESSONS.length} 节小课，边看边动手，
            最后和两个电脑对手打一整局——学完就能和会打的人上桌。
          </p>
          <div {...stylex.props(styles.heroMeta)}>
            <Pill tone="felt">{LESSONS.length} 课 · 约 {totalMinutes} 分钟</Pill>
            <Pill tone="felt">12 岁以上</Pill>
            <Pill tone="felt">进度自动保存在这台设备</Pill>
          </div>
        </div>
        <div {...stylex.props(styles.progress)}>
          <div {...stylex.props(styles.progressHead)}>
            <span {...stylex.props(styles.progressLabel)}>总体进度</span>
            <span data-testid="skat-overall" {...stylex.props(styles.progressPct)}>{pct}%</span>
          </div>
          <ProgressBar value={finished / LESSONS.length} label="总体进度" />
          <span {...stylex.props(styles.progressNote)}>
            已完成 {finished} / {LESSONS.length} 课{tally.games > 0 ? ` · 对局 ${tally.games} 场，赢 ${tally.won} 场` : ''}
          </span>
          {current ? (
            <Link to="/lesson/$id" params={{ id: current.id }} data-testid="skat-resume" {...linkLook('primary', 'lg')}>
              {finished === 0 ? '开始第 1 课' : `继续：第 ${current.id} 课`}
            </Link>
          ) : (
            <Link to="/play" {...linkLook('primary', 'lg')}>🎓 已毕业 · 去打牌</Link>
          )}
        </div>
      </section>

      <ol {...stylex.props(styles.list)}>
        {LESSONS.map((l) => {
          const record = done[l.id]
          const open = isUnlocked(l.id, done)
          const state = record ? 'done' : open ? 'open' : 'locked'
          const inner = (
            <>
              <span {...stylex.props(styles.emoji, state === 'locked' && styles.emojiLocked)}>{state === 'locked' ? '🔒' : l.emoji}</span>
              <span {...stylex.props(styles.lessonText)}>
                <span {...stylex.props(styles.lessonTitle)}>第 {l.id} 课 · {l.title}</span>
                <span {...stylex.props(styles.lessonPromise)}>{l.promise}</span>
              </span>
              <span {...stylex.props(styles.lessonEnd)}>
                {record ? <Stars n={record.stars} /> : <span {...stylex.props(styles.minutes)}>{l.minutes} 分钟</span>}
              </span>
            </>
          )
          return (
            <li key={l.id} {...stylex.props(styles.item)}>
              {open ? (
                <Link
                  to="/lesson/$id"
                  params={{ id: l.id }}
                  data-testid="skat-lesson-card"
                  data-lesson={l.id}
                  data-state={state}
                  {...stylex.props(styles.card, state === 'done' && styles.cardDone, state === 'open' && styles.cardOpen)}
                >
                  {inner}
                </Link>
              ) : (
                <div data-testid="skat-lesson-card" data-lesson={l.id} data-state={state} aria-disabled="true" {...stylex.props(styles.card, styles.cardLocked)}>
                  {inner}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <section {...stylex.props(styles.free)}>
        <div>
          <h2 {...stylex.props(styles.h2)}>自由对局</h2>
          <p {...stylex.props(styles.freeNote)}>已经会了，或者想先试试手？直接和莉娜、马克斯开一桌，规则由程序把关，随时可以要提示。</p>
        </div>
        <Link to="/play" data-testid="skat-free-play" {...linkLook('felt', 'lg')}>开一桌 →</Link>
      </section>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: 24 },
  hero: {
    display: 'grid',
    gridTemplateColumns: { default: '1.3fr 1fr', '@media (max-width: 720px)': '1fr' },
    gap: 20,
    padding: { default: 28, '@media (max-width: 480px)': 18 },
    borderRadius: 24,
    backgroundColor: skat.felt,
    backgroundImage: `radial-gradient(ellipse at 20% 0%, ${skat.feltLight} 0%, ${skat.felt} 50%, ${skat.feltDeep} 100%)`,
    color: skat.white,
  },
  heroText: { display: 'flex', flexDirection: 'column', gap: 12 },
  h1: { margin: 0, fontSize: { default: 36, '@media (max-width: 480px)': 28 }, lineHeight: 1.2, fontWeight: 800, color: skat.white, fontFamily: '"Fraunces", "Songti SC", "Noto Serif SC", serif' },
  // Colour is stated, not inherited: the app's reset gives headings and paragraphs the theme's text
  // colour, which on this felt is dark on dark.
  lead: { margin: 0, fontSize: 16, lineHeight: 1.75, color: skat.white, opacity: 0.95 },
  heroMeta: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: skat.paper,
    color: skat.ink,
    alignSelf: 'start',
  },
  progressHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' },
  progressLabel: { fontSize: 14, fontWeight: 700, color: skat.inkSoft },
  progressPct: { fontSize: 30, fontWeight: 800, color: skat.ink },
  progressNote: { fontSize: 13, color: skat.inkSoft },
  list: { listStyleType: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  item: { margin: 0 },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: { default: 16, '@media (max-width: 480px)': 12 },
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    textDecoration: 'none',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: '140ms',
  },
  cardOpen: {
    borderColor: { default: skat.brass, ':hover': skat.brassDeep },
    boxShadow: { default: `0 3px 0 ${skat.brass}`, ':hover': `0 6px 14px ${skat.shadowSoft}` },
    transform: { default: 'translateY(0)', ':hover': 'translateY(-2px)' },
  },
  cardDone: { borderColor: { default: skat.good, ':hover': skat.good }, backgroundColor: skat.goodSoft },
  cardLocked: { opacity: 0.55, cursor: 'not-allowed', backgroundColor: skat.paperDeep },
  emoji: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: skat.brassSoft,
    fontSize: 28,
    flexShrink: 0,
  },
  emojiLocked: { backgroundColor: skat.paperEdge, fontSize: 22 },
  lessonText: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flexGrow: 1 },
  lessonTitle: { fontSize: 17, fontWeight: 800 },
  lessonPromise: { fontSize: 14, lineHeight: 1.5, color: skat.inkSoft },
  lessonEnd: { flexShrink: 0 },
  minutes: { fontSize: 13, fontWeight: 600, color: skat.inkFaint, whiteSpace: 'nowrap' },
  free: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: skat.paperDeep,
  },
  h2: { margin: 0, fontSize: 20, fontWeight: 800, color: skat.ink },
  freeNote: { margin: 0, marginTop: 4, fontSize: 14, lineHeight: 1.6, color: skat.inkSoft, maxWidth: 480 },
})
