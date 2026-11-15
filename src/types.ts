/** Shared domain types. Content is bilingual: every user-facing string has `es` and `en`. */

export type Lang = 'es' | 'en'
export type L10n = Record<Lang, string>
export type L10nList = Record<Lang, string[]>

/** The four exercise sections of the app. */
export type Section = 'gym' | 'functional' | 'home' | 'adapted'

export type Muscle =
  | 'legs'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'mobility'

/** Movement pattern. The plan generator fills a session by slot, not by muscle. */
export type Slot =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push'
  | 'pull'
  | 'overhead'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'mobility'

/** 1 beginner, 2 intermediate, 3 advanced. */
export type Level = 1 | 2 | 3

export type ConditionId =
  | 'knee'
  | 'lowerBack'
  | 'shoulder'
  | 'wrist'
  | 'neck'
  | 'hip'
  | 'ankle'
  | 'hypertension'
  | 'heart'
  | 'diabetes'
  | 'asthma'
  | 'osteoporosis'
  | 'pregnancy'
  | 'obesity'
  | 'senior'

/** What the stick figure holds. Drawn at the pose's attachment point. */
export type Gear = 'none' | 'barbell' | 'dumbbell' | 'kettlebell' | 'ball' | 'band'

export const POSE_IDS = [
  'squat',
  'squatHold',
  'barSquat',
  'jumpSquat',
  'sitToStand',
  'wallSit',
  'lunge',
  'stepUp',
  'boxJump',
  'calfRaise',
  'deadlift',
  'swing',
  'row',
  'overheadPress',
  'thruster',
  'slam',
  'curl',
  'tricepsExt',
  'lateralRaise',
  'pullup',
  'latPulldown',
  'seatedRow',
  'legPress',
  'dip',
  'pushup',
  'kneePushup',
  'inclinePushup',
  'wallPushup',
  'plank',
  'sidePlank',
  'mountainClimber',
  'burpee',
  'benchPress',
  'floorPress',
  'crunch',
  'legRaise',
  'vSit',
  'deadBug',
  'gluteBridge',
  'superman',
  'birdDog',
  'childPose',
  'kneeToChest',
  'sideLegRaise',
  'forwardFold',
  'jumpingJack',
  'highKnees',
  'walk',
  'jumpRope',
  'seated',
  'pendulum',
  'singleLegStand',
] as const

export type PoseId = (typeof POSE_IDS)[number]

export interface Exercise {
  /** Unique, kebab-case, prefixed by its file: `gym-`, `fun-`, `home-`, `ada-`. */
  id: string
  /** Sections whose library lists it. */
  sections: Section[]
  muscle: Muscle
  slot: Slot
  level: Level
  pose: PoseId
  gear: Gear
  /** `high` means jumping or running: swapped out for joint, heart and weight conditions. */
  impact: 'low' | 'high'
  /** Dosed in repetitions or in seconds (holds, cardio). */
  unit: 'reps' | 'secs'
  /** True when the dose is per side (lunges, side plank). */
  perSide?: boolean
  name: L10n
  /** What is needed, in words: "Barra y discos", "Mochila con libros". */
  equipment: L10n
  /** Technique, in order. 3 or 4 short steps. */
  steps: L10nList
  /** The 2 most common mistakes. */
  mistakes: L10nList
  breathing: L10n
  /** Conditions for which the exercise is left out. */
  avoid: ConditionId[]
  /** Conditions for which it stays, with a warning and a modification. */
  caution: ConditionId[]
  /** Conditions it is recommended for (adapted section). */
  helps?: ConditionId[]
}

export type Sex = 'female' | 'male'
export type Goal = 'lose' | 'maintain' | 'gain'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
export type Place = 'gym' | 'functional' | 'home'

export interface Profile {
  name: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  waistCm?: number
  neckCm?: number
  hipCm?: number
  activity: Activity
  goal: Goal
  level: Level
  place: Place
  daysPerWeek: number
  conditions: ConditionId[]
}
