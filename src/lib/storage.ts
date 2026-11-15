/**
 * The saved state and its validation. Everything the app stores lives in the browser's
 * localStorage under one key: no account, no server, no cost. `parseState` treats what
 * it reads as untrusted (an old version, a hand-edited backup) and repairs or drops it.
 */
import { exerciseById } from '../data/exercises'
import { CONDITIONS } from '../data/conditions'
import type { Activity, ConditionId, Goal, Lang, Level, Place, Profile, Sex } from '../types'
import type { MonthPlan, PlanItem, Session, Week } from './plan'

export const STORAGE_KEY = 'entrena-libre:v1'

export type Theme = 'light' | 'dark'

export interface Measurement {
  /** `YYYY-MM-DD`. */
  date: string
  weightKg: number
  waistCm?: number
}

export interface AppState {
  v: 1
  lang: Lang
  theme: Theme
  profile: Profile | null
  /** By month, `YYYY-MM`. */
  plans: Record<string, MonthPlan>
  /** Oldest first, one per date. */
  measurements: Measurement[]
}

export const LIMITS = {
  age: [14, 100],
  heightCm: [120, 230],
  weightKg: [30, 300],
  waistCm: [40, 200],
  neckCm: [20, 70],
  hipCm: [50, 200],
} as const

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const oneOf = <T extends string | number>(v: unknown, options: readonly T[]): v is T => options.includes(v as T)
const inRange = (v: unknown, [min, max]: readonly [number, number]): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const optional = (v: unknown, range: readonly [number, number]) => (inRange(v, range) ? v : undefined)

const SEXES: Sex[] = ['female', 'male']
const GOALS: Goal[] = ['lose', 'maintain', 'gain']
const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'athlete']
const PLACES: Place[] = ['gym', 'functional', 'home']
const LEVELS: Level[] = [1, 2, 3]
const CONDITION_IDS = CONDITIONS.filter((c) => !c.derived).map((c) => c.id)

/** A valid profile, or null when a required field is missing or out of range. */
export function parseProfile(v: unknown): Profile | null {
  if (!isRec(v)) return null
  const ok =
    oneOf(v.sex, SEXES) &&
    inRange(v.age, LIMITS.age) &&
    inRange(v.heightCm, LIMITS.heightCm) &&
    inRange(v.weightKg, LIMITS.weightKg) &&
    oneOf(v.activity, ACTIVITIES) &&
    oneOf(v.goal, GOALS) &&
    oneOf(v.level, LEVELS) &&
    oneOf(v.place, PLACES) &&
    inRange(v.daysPerWeek, [2, 6])
  if (!ok) return null
  return {
    name: typeof v.name === 'string' ? v.name.slice(0, 40) : '',
    sex: v.sex as Sex,
    age: v.age as number,
    heightCm: v.heightCm as number,
    weightKg: v.weightKg as number,
    waistCm: optional(v.waistCm, LIMITS.waistCm),
    neckCm: optional(v.neckCm, LIMITS.neckCm),
    hipCm: optional(v.hipCm, LIMITS.hipCm),
    activity: v.activity as Activity,
    goal: v.goal as Goal,
    level: v.level as Level,
    place: v.place as Place,
    daysPerWeek: Math.round(v.daysPerWeek as number),
    conditions: Array.isArray(v.conditions) ? CONDITION_IDS.filter((c: ConditionId) => (v.conditions as unknown[]).includes(c)) : [],
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MONTH = /^\d{4}-\d{2}$/

function parseItem(v: unknown): PlanItem | null {
  if (!isRec(v) || typeof v.exerciseId !== 'string' || !exerciseById(v.exerciseId)) return null
  if (!inRange(v.sets, [1, 10]) || !inRange(v.amount, [1, 600]) || !inRange(v.restSec, [0, 600])) return null
  if (!oneOf(v.unit, ['reps', 'secs'] as const)) return null
  return { exerciseId: v.exerciseId, sets: v.sets, amount: v.amount, unit: v.unit, restSec: v.restSec, ...(v.prep === true && { prep: true }) }
}

function parseSession(v: unknown): Session | null {
  if (!isRec(v) || typeof v.id !== 'string' || !Array.isArray(v.items)) return null
  if (!oneOf(v.kind, ['full', 'upper', 'lower', 'push', 'pull', 'legs'] as const)) return null
  // Exercises removed from the catalogue since the plan was saved are dropped.
  const items = v.items.map(parseItem).filter((i): i is PlanItem => i !== null)
  return {
    id: v.id,
    kind: v.kind,
    items,
    ...(typeof v.doneAt === 'string' && ISO_DATE.test(v.doneAt) && { doneAt: v.doneAt }),
    ...(inRange(v.minutes, [0, 600]) && { minutes: v.minutes }),
  }
}

function parsePlan(v: unknown): MonthPlan | null {
  if (!isRec(v) || typeof v.month !== 'string' || !MONTH.test(v.month) || !Array.isArray(v.weeks)) return null
  if (!oneOf(v.place, PLACES) || !oneOf(v.goal, GOALS) || !oneOf(v.level, LEVELS)) return null
  const weeks: Week[] = []
  for (const w of v.weeks) {
    if (!isRec(w) || !Array.isArray(w.sessions)) return null
    if (!oneOf(w.focus, ['base', 'volume', 'intensity', 'deload'] as const)) return null
    const sessions = w.sessions.map(parseSession)
    if (sessions.some((s) => s === null)) return null
    weeks.push({ focus: w.focus, sessions: sessions as Session[] })
  }
  return { month: v.month, cycle: inRange(v.cycle, [0, 10_000]) ? v.cycle : 0, place: v.place, goal: v.goal, level: v.level, weeks }
}

function parseMeasurements(v: unknown): Measurement[] {
  if (!Array.isArray(v)) return []
  const byDate = new Map<string, Measurement>()
  for (const m of v) {
    if (!isRec(m) || typeof m.date !== 'string' || !ISO_DATE.test(m.date) || !inRange(m.weightKg, LIMITS.weightKg)) continue
    byDate.set(m.date, { date: m.date, weightKg: m.weightKg, waistCm: optional(m.waistCm, LIMITS.waistCm) })
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function defaultState(lang: Lang, theme: Theme): AppState {
  return { v: 1, lang, theme, profile: null, plans: {}, measurements: [] }
}

/** Reads saved or imported JSON. Returns null when it is not this app's data at all. */
export function parseState(raw: string | null, fallback: AppState): AppState | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRec(data) || data.v !== 1) return null
  const plans: Record<string, MonthPlan> = {}
  if (isRec(data.plans)) {
    for (const value of Object.values(data.plans)) {
      const plan = parsePlan(value)
      if (plan) plans[plan.month] = plan
    }
  }
  return {
    v: 1,
    lang: oneOf(data.lang, ['es', 'en'] as const) ? data.lang : fallback.lang,
    theme: oneOf(data.theme, ['light', 'dark'] as const) ? data.theme : fallback.theme,
    profile: parseProfile(data.profile),
    plans,
    measurements: parseMeasurements(data.measurements),
  }
}

/** Adds or replaces the measurement for its date, keeping the list sorted. */
export function upsertMeasurement(list: readonly Measurement[], m: Measurement): Measurement[] {
  return [...list.filter((x) => x.date !== m.date), m].sort((a, b) => a.date.localeCompare(b.date))
}
