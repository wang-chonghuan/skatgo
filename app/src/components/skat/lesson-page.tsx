import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

import { lessonById } from '~/lib/skat/lessons/content'
import { LessonPlayer } from './lesson-player'

/**
 * The page behind /lesson/$id. Every lesson opens directly, whatever the learner has done before
 * (SKATGO-7); only an id that is not a lesson sends the learner back to the map.
 */
export function LessonPage() {
  const { id } = useParams({ from: '/lesson/$id' })
  const lesson = lessonById(id)
  const navigate = useNavigate()

  useEffect(() => {
    if (!lesson) void navigate({ to: '/', replace: true })
  }, [lesson, navigate])

  if (!lesson) return null
  return <LessonPlayer key={id} lesson={lesson} />
}
