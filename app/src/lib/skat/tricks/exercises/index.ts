import type { Locale } from '~/paraglide/runtime'
import { EXERCISES } from './positions'
import { EXERCISES_DE } from './text.de'
import { EXERCISES_EN } from './text.en'
import { EXERCISE_TYPES, type Exercise, type ExerciseType, type ExercisesText } from './types'

export { EXERCISES, EXERCISE_TYPES }

/** The exercises' words in each language (SKATGO-103). */
export const EXERCISE_TEXT: Record<Locale, ExercisesText> = { en: EXERCISES_EN, de: EXERCISES_DE }

export const exerciseById = (id: string): Exercise | undefined => EXERCISES.find((e) => e.id === id)

/** A type's exercises, in order. */
export const exercisesOf = (type: ExerciseType): Exercise[] => EXERCISES.filter((e) => e.type === type)

/** The exercise after this one: the next of its type, then the first of the next type; none after the last. */
export function nextExercise(id: string): Exercise | undefined {
  const i = EXERCISES.findIndex((e) => e.id === id)
  return i < 0 ? undefined : EXERCISES[i + 1]
}
