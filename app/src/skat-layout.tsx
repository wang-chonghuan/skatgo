import { Link, Outlet } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { skat } from './theme/skat.stylex'

// The frame around every page of the course: the felt-green header and the reading column.
//
// Carried over verbatim from Parrottoon's /skat route, where this course was built (PARROT-42), so
// that skatgo.com renders exactly what parrottoon.com/skat does. The one change is where "back"
// goes: on Parrottoon it was a relative link to the home of the language pair, which on this domain
// would be a 404, so it now names Parrottoon's address in full. The text and look are unchanged.
const PARROTTOON_HOME = 'https://parrottoon.com/zh/en'

export function SkatLayout() {
  return (
    <div lang="zh-Hans" {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(styles.brand)}>
          <span {...stylex.props(styles.brandMark)}>♣</span>
          斯卡特速成课
        </Link>
        <a href={PARROTTOON_HOME} {...stylex.props(styles.back)}>← 回 Parrottoon</a>
      </header>
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = stylex.create({
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: skat.paper,
    color: skat.ink,
    colorScheme: 'light',
    fontFamily: '"DM Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBlock: 12,
    paddingInline: { default: 24, '@media (max-width: 480px)': 14 },
    backgroundColor: skat.feltDeep,
    color: skat.white,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, color: skat.white, textDecoration: 'none', fontWeight: 800, fontSize: 17 },
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: skat.brass,
    color: skat.ink,
    fontSize: 20,
  },
  back: { color: skat.white, opacity: 0.85, textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
  main: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 860,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: 28, '@media (max-width: 480px)': 16 },
    paddingInline: { default: 24, '@media (max-width: 480px)': 12 },
  },
})
