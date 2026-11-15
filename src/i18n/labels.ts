/** Message keys for the domain's enumerations, so pages never build a key from a string. */
import type { DishTag, MealType } from '../data/meals'
import type { BmiCategory } from '../lib/nutrition'
import type { SessionKind, WeekFocus } from '../lib/plan'
import type { Activity, Goal, Level, Muscle, Section } from '../types'
import type { MessageKey } from './es'

export const SECTIONS: Section[] = ['gym', 'functional', 'home', 'adapted']

export const SECTION_KEY: Record<Section, MessageKey> = {
  gym: 'secGym',
  functional: 'secFunctional',
  home: 'secHome',
  adapted: 'secAdapted',
}
export const SECTION_DESC_KEY: Record<Section, MessageKey> = {
  gym: 'secGymDesc',
  functional: 'secFunctionalDesc',
  home: 'secHomeDesc',
  adapted: 'secAdaptedDesc',
}
export const MUSCLE_KEY: Record<Muscle, MessageKey> = {
  legs: 'mLegs',
  glutes: 'mGlutes',
  chest: 'mChest',
  back: 'mBack',
  shoulders: 'mShoulders',
  arms: 'mArms',
  core: 'mCore',
  cardio: 'mCardio',
  mobility: 'mMobility',
}
export const LEVEL_KEY: Record<Level, MessageKey> = { 1: 'level1', 2: 'level2', 3: 'level3' }
export const KIND_KEY: Record<SessionKind, MessageKey> = {
  full: 'kindFull',
  upper: 'kindUpper',
  lower: 'kindLower',
  push: 'kindPush',
  pull: 'kindPull',
  legs: 'kindLegs',
}
export const FOCUS_KEY: Record<WeekFocus, MessageKey> = {
  base: 'focusBase',
  volume: 'focusVolume',
  intensity: 'focusIntensity',
  deload: 'focusDeload',
}
export const GOAL_KEY: Record<Goal, MessageKey> = { lose: 'goalLose', maintain: 'goalMaintain', gain: 'goalGain' }
export const GOAL_NOTE_KEY: Record<Goal, MessageKey> = {
  lose: 'targetLoseNote',
  maintain: 'targetMaintainNote',
  gain: 'targetGainNote',
}
export const ACTIVITY_KEY: Record<Activity, MessageKey> = {
  sedentary: 'actSedentary',
  light: 'actLight',
  moderate: 'actModerate',
  active: 'actActive',
  athlete: 'actAthlete',
}
export const BMI_KEY: Record<BmiCategory, MessageKey> = {
  under: 'bmiUnder',
  normal: 'bmiNormal',
  over: 'bmiOver',
  obese1: 'bmiObese1',
  obese2: 'bmiObese2',
  obese3: 'bmiObese3',
}
export const MEAL_KEY: Record<MealType, MessageKey> = {
  breakfast: 'mealBreakfast',
  lunch: 'mealLunch',
  dinner: 'mealDinner',
  snack: 'mealSnack',
}
export const TAG_KEY: Record<DishTag, MessageKey> = { veg: 'tagVeg', lowGi: 'tagLowGi', lowSodium: 'tagLowSodium' }
