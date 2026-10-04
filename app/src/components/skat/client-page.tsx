import { CourseHome } from './course-home'
import { DailyPage, DailyPlay } from './daily-page'
import { EntryPage } from './entry-page'
import { FreePlay } from './free-play'
import { LessonPage } from './lesson-page'
import { RulesPage } from './rules-page'
import { NotFoundPage } from './not-found'

// How the routes reach the course's pages — the only way they may (engineering.md, redline 4).
//
// Every page is rendered on the server (SKATGO-1, SKATGO-23, SKATGO-29), so search engines read each
// language's titles, text and links. What only the browser can render — a lesson's player and the
// free-play table — each page loads lazily through ./client-part.tsx; progress is applied after mount.
const PAGES = { entry: EntryPage, daily: DailyPage, dailyPlay: DailyPlay, course: CourseHome, lesson: LessonPage, rules: RulesPage, play: FreePlay, notFound: NotFoundPage }

export function ClientPage({ page }: { page: keyof typeof PAGES }) {
  const Page = PAGES[page]
  return <Page />
}
