/**
 * What the one-time Premium purchase unlocks. Pure rules: the purchase itself is in
 * `purchases.ts`, and whether the paywall is active at all is decided in `paywall.ts`.
 *
 * Free: the gym, functional, home, stretching and adapted libraries, body metrics and
 * calories, the monthly plan for gym, functional and home, guided sessions and progress.
 * Premium: the Pilates and martial-arts sections and their plans, the suggested menus,
 * and swapping a plan's exercises for a new variation.
 *
 * The adapted section and every contraindication warning stay free on purpose: nobody
 * should have to pay to learn that an exercise is unsafe for them.
 */
import type { Exercise, Place, Section } from '../types'

export const PREMIUM_SECTIONS: Section[] = ['pilates', 'mma']

/** Features that are premium and are not a section of the library. */
export type PremiumFeature = 'menus' | 'regenerate'

export interface PremiumStatus {
  /** Whether this build has a paywall at all. */
  enabled: boolean
  /** Whether the person owns Premium. */
  entitled: boolean
}

/** Everything is open when there is no paywall or Premium is owned. */
export const isUnlocked = (status: PremiumStatus): boolean => !status.enabled || status.entitled

export const isPremiumSection = (section: Section): boolean => PREMIUM_SECTIONS.includes(section)

/** An exercise listed in a free section is free, wherever else it appears. */
export const isPremiumExercise = (e: Exercise): boolean => e.sections.every(isPremiumSection)

export const isPremiumPlace = (place: Place): boolean => isPremiumSection(place)

export const lockedSection = (section: Section, status: PremiumStatus): boolean => isPremiumSection(section) && !isUnlocked(status)

export const lockedExercise = (e: Exercise, status: PremiumStatus): boolean => isPremiumExercise(e) && !isUnlocked(status)

export const lockedPlace = (place: Place, status: PremiumStatus): boolean => isPremiumPlace(place) && !isUnlocked(status)
