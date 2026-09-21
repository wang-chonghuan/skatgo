import { Link, Outlet } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { skat } from './theme/skat.stylex'

// The frame around every page of the course: the felt-green header and the reading column.
//
// Carried over verbatim from Parrottoon's /skat route, where this course was built (PARROT-42), so
// that skatgo.com renders what parrottoon.com/skat does. One deliberate difference: Parrottoon's
// header also carries a "← 回 Parrottoon" link. skatgo.com is its own site, so it has none.

export function SkatLayout() {
  return (
    <div lang="zh-Hans" {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(styles.brand)}>
          <span {...stylex.props(styles.brandMark)}>♣</span>
          斯卡特速成课
        </Link>
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
