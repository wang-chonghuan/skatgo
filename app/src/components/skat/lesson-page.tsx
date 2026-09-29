import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

import { BookOpen } from 'lucide-react'

import { lessonById } from '~/lib/skat/lessons/content'
import { m } from '~/paraglide/messages'
import { Band } from './frame'
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
    if (!lesson) void navigate({ to: '/course', replace: true })
  }, [lesson, navigate])

  if (!lesson) return null
  // The course's band, titled with the lesson; its back link returns to the course map (SKATGO-26).
  return (
    <>
      <Band title={m.lesson_heading({ id: lesson.id, title: lesson.title })} Icon={BookOpen} back="/course" />
      <LessonPlayer key={id} lesson={lesson} />
    </>
  )
}
