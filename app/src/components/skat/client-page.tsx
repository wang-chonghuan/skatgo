import { lazyRouteComponent } from '@tanstack/react-router'

import { NotFoundPage } from './not-found'

// How the routes reach the course's pages — the only way they may (engineering.md, redline 4).
//
// Every page is rendered on the server (SKATGO-1, SKATGO-23, SKATGO-29), so search engines read each
// language's titles, text and links. What only the browser can render — a lesson's player and the
// free-play table — each page loads lazily through ./client-part.tsx; progress is applied after mount.
//
// Each page is its own chunk (SKATGO-107: the front page used to carry every page's code, a megabyte, and
// a phone froze for seconds running it). A route's component is the page's lazy component; the router
// loads it before it renders on the server and before the browser takes the page over, so the server's
// HTML is never replaced by a gap.
const PAGES = {
  entry: lazyRouteComponent(() => import('./entry-page'), 'EntryPage'),
  daily: lazyRouteComponent(() => import('./daily-page'), 'DailyPage'),
  dailyPlay: lazyRouteComponent(() => import('./daily-page'), 'DailyPlay'),
  course: lazyRouteComponent(() => import('./course-home'), 'CourseHome'),
  lesson: lazyRouteComponent(() => import('./lesson-page'), 'LessonPage'),
  rules: lazyRouteComponent(() => import('./rules-page'), 'RulesPage'),
  biddingTable: lazyRouteComponent(() => import('./bidding-table-page'), 'BiddingTablePage'),
  scoreSheet: lazyRouteComponent(() => import('./score-sheet-page'), 'ScoreSheetPage'),
  rulesSummary: lazyRouteComponent(() => import('./rules-summary-page'), 'RulesSummaryPage'),
  tricks: lazyRouteComponent(() => import('./tricks-page'), 'TricksPage'),
  tricksExercise: lazyRouteComponent(() => import('./tricks-exercise-page'), 'TricksExercisePage'),
  forum: lazyRouteComponent(() => import('./forum-page'), 'ForumPage'),
  forumPost: lazyRouteComponent(() => import('./forum-page'), 'ForumPostPage'),
  quickStart: lazyRouteComponent(() => import('./quick-start-page'), 'QuickStartPage'),
  play: lazyRouteComponent(() => import('./free-play'), 'FreePlay'),
  shared: lazyRouteComponent(() => import('./shared-page'), 'SharedPage'),
  practice: lazyRouteComponent(() => import('./shared-page'), 'PracticePage'),
  profile: lazyRouteComponent(() => import('./profile-page'), 'ProfilePage'),
  friends: lazyRouteComponent(() => import('./friends-page'), 'FriendsPage'),
  table: lazyRouteComponent(() => import('./friends-page'), 'TablePage'),
  privacy: lazyRouteComponent(() => import('./legal-page'), 'PrivacyPage'),
  terms: lazyRouteComponent(() => import('./legal-page'), 'TermsPage'),
}

/** The route component of a page. */
export const clientPage = (page: keyof typeof PAGES) => PAGES[page]

/** The page for an address nothing answers — small, and needed before any route is known. */
export const ClientNotFound = NotFoundPage
