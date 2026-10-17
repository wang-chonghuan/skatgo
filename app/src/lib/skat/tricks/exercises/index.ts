import type { Locale } from '~/paraglide/runtime'
import { EXERCISES } from './positions'
import { EXERCISES_DE } from './text.de'
import { EXERCISES_EN } from './text.en'
import { EXERCISE_TYPES, type Exercise, type ExerciseType, type ExercisesText } from './types'

export { EXERCISES, EXERCISE_TYPES }

/** The exercises' words in each language (SKATGO-103). */
export const EXERCISE_TEXT: Record<Locale, ExercisesText> = { en: EXERCISES_EN, de: EXERCISES_DE }

/** The kinds the site shows (SKATGO-110, the human: 「以前的所有练习，都隐藏掉，先不删」): the open-card endgames only.
 *  The others stay here, proven by their tests, and come back by being listed again. */
export const SHOWN_TYPES: readonly ExerciseType[] = ['offenes-endspiel']

const shown = EXERCISES.filter((e) => SHOWN_TYPES.includes(e.type))

/** An exercise the site shows; a hidden one is not found. */
export const exerciseById = (id: string): Exercise | undefined => shown.find((e) => e.id === id)

/** A type's exercises, in order. */
export const exercisesOf = (type: ExerciseType): Exercise[] => EXERCISES.filter((e) => e.type === type)

/** The exercise after this one among those shown: the next of its type, then the first of the next type; none after
 *  the last. */
export function nextExercise(id: string): Exercise | undefined {
  const i = shown.findIndex((e) => e.id === id)
  return i < 0 ? undefined : shown[i + 1]
}
