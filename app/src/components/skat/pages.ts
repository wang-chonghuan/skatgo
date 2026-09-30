// The browser-only parts of the course, behind one module so the pages load them as a single lazy chunk:
// the lesson player and the free-play table. Everything around them — titles, text, links — is rendered
// on the server by the pages themselves (see ./client-page.tsx).
export { FreeTable } from './free-table'
export { LessonPlayer } from './lesson-player'
