import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

import { isUnlocked, lessonById } from '~/lib/skat/lessons/content'
import { useProgress } from '~/lib/skat/progress'
import { LessonPlayer } from './lesson-player'

/** The page behind /skat/lesson/$id: gate on progress, then play the lesson. */
export function LessonPage() {
  const { id } = useParams({ from: '/lesson/$id' })
  const lesson = lessonById(id)
  const hydrated = useProgress((s) => s.hydrated)
  const done = useProgress((s) => s.done)
  const navigate = useNavigate()
  const open = lesson !== undefined && isUnlocked(id, done)

  // Progress lives in localStorage, so whether this lesson is open is only knowable in the browser,
  // after the store has read it. A locked (or non-existent) lesson sends the learner back to the map.
  useEffect(() => {
    if (hydrated && !open) void navigate({ to: '/', replace: true })
  }, [hydrated, open, navigate])

  // Nothing until the store has read localStorage: before that, every lesson but the first looks locked.
  if (!hydrated || !open || !lesson) return null
  return <LessonPlayer key={id} lesson={lesson} />
}
