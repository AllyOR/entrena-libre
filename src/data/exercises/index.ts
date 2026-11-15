import type { Exercise, Section } from '../../types'
import { adaptedExercises } from './adapted'
import { functionalExercises } from './functional'
import { gymExercises } from './gym'
import { homeExercises } from './home'

export const EXERCISES: readonly Exercise[] = [
  ...gymExercises,
  ...functionalExercises,
  ...homeExercises,
  ...adaptedExercises,
]

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export const exerciseById = (id: string): Exercise | undefined => BY_ID.get(id)

export const exercisesIn = (section: Section): Exercise[] => EXERCISES.filter((e) => e.sections.includes(section))
