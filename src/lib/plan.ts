/**
 * Monthly plan generator. Pure and deterministic: the same profile, month and cycle
 * always give the same plan, so a plan can be rebuilt and tested.
 *
 * A month is four weeks: base, volume, intensity, deload. Weeks 1–2 and weeks 3–4 are
 * two blocks with different exercises, so there is variety inside the month and
 * between months, while each block repeats once to make progress measurable.
 */
import { EXERCISES } from '../data/exercises'
import type { ConditionId, Exercise, Goal, Level, Place, Profile, Section, Slot } from '../types'
import { effectiveConditions } from './nutrition'

export type SessionKind = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'legs'
export type WeekFocus = 'base' | 'volume' | 'intensity' | 'deload'

export interface PlanItem {
  exerciseId: string
  sets: number
  /** Repetitions or seconds per set, by `unit`. */
  amount: number
  unit: 'reps' | 'secs'
  restSec: number
  /** An adapted warm-up exercise chosen for the profile's conditions. */
  prep?: boolean
}

export interface Session {
  /** `w1d1` … `w4d6`. */
  id: string
  kind: SessionKind
  items: PlanItem[]
  /** ISO date the session was completed. */
  doneAt?: string
  minutes?: number
}

export interface Week {
  focus: WeekFocus
  sessions: Session[]
}

export interface MonthPlan {
  /** `YYYY-MM`. */
  month: string
  /** How many plans came before: varies the exercise selection. */
  cycle: number
  place: Place
  goal: Goal
  level: Level
  weeks: Week[]
}

export const MIN_DAYS = 2
export const MAX_DAYS = 6

const SPLITS: Record<number, SessionKind[]> = {
  2: ['full', 'full'],
  3: ['full', 'full', 'full'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
}

const SLOTS: Record<SessionKind, Slot[]> = {
  full: ['squat', 'push', 'hinge', 'pull', 'lunge', 'core'],
  upper: ['push', 'pull', 'overhead', 'pull', 'arms', 'core'],
  lower: ['squat', 'hinge', 'lunge', 'squat', 'core'],
  push: ['push', 'overhead', 'push', 'arms', 'core'],
  pull: ['pull', 'hinge', 'pull', 'arms', 'core'],
  legs: ['squat', 'hinge', 'lunge', 'squat', 'core'],
}

/**
 * Where to look, in order, when the chosen place has too few safe exercises for a slot.
 * The adapted exercises need no equipment, so they come first.
 */
const FALLBACK: Record<Place, Section[]> = {
  gym: ['gym', 'adapted', 'functional'],
  functional: ['functional', 'adapted', 'home'],
  home: ['home', 'adapted', 'functional'],
  pilates: ['pilates', 'adapted', 'home'],
  mma: ['mma', 'home', 'adapted'],
}

const FOCUS: WeekFocus[] = ['base', 'volume', 'intensity', 'deload']
const REPS: Record<Goal, number[]> = { gain: [8, 10, 10, 8], maintain: [10, 12, 12, 10], lose: [12, 15, 15, 12] }
const REST: Record<Goal, number> = { gain: 90, maintain: 60, lose: 45 }
const SECS_STEP = [0, 5, 10, 0]

function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return h
}

function dose(e: Exercise, p: Profile, week: number, fragile: boolean): Omit<PlanItem, 'exerciseId'> {
  const baseSets = p.level + 1
  let sets = FOCUS[week] === 'intensity' ? baseSets + 1 : FOCUS[week] === 'deload' ? Math.max(baseSets - 1, 2) : baseSets
  let restSec = e.slot === 'core' || e.slot === 'cardio' ? 45 : REST[p.goal]
  // Heart and blood-pressure conditions: fewer sets, longer rests.
  if (fragile) {
    sets = Math.min(sets, 3)
    restSec += 30
  }
  if (e.unit === 'secs') {
    const base = e.slot === 'cardio' ? 30 + 15 * (p.level - 1) : 20 + 10 * (p.level - 1)
    return { sets, amount: base + SECS_STEP[week] * (e.slot === 'cardio' ? 2 : 1), unit: 'secs', restSec }
  }
  return { sets, amount: REPS[p.goal][week], unit: 'reps', restSec }
}

export function generatePlan(profile: Profile, month: string, cycle: number): MonthPlan {
  const conditions = effectiveConditions(profile)
  const days = Math.min(Math.max(Math.round(profile.daysPerWeek), MIN_DAYS), MAX_DAYS)
  const seed = hash(`${month}:${cycle}`)
  const fragile = conditions.includes('heart') || conditions.includes('hypertension')

  const safe = (e: Exercise) => e.level <= profile.level && !e.avoid.some((c) => conditions.includes(c))

  // Gym, functional and home plans top a slot up from the fallbacks for variety. Pilates
  // and martial arts keep to their own exercises whenever they have one for the slot.
  const style = profile.place === 'pilates' || profile.place === 'mma'
  const enough = style ? 1 : 2

  /** Safe exercises for a slot: the chosen place's first, then the fallbacks while there are too few. */
  const candidates = (slot: Slot): Exercise[] => {
    const found: Exercise[] = []
    for (const section of FALLBACK[profile.place]) {
      const own = section === profile.place
      // Only gym and functional training have gym or box equipment: the rest borrow
      // household exercises freely, and from elsewhere only what needs no equipment.
      const equipped = profile.place === 'gym' || profile.place === 'functional'
      const usable = (e: Exercise) => own || equipped || section === 'adapted' || section === 'home' || e.gear === 'none'
      for (const e of EXERCISES) {
        if (e.slot === slot && e.sections.includes(section) && safe(e) && usable(e) && !found.includes(e)) found.push(e)
      }
      if (found.length >= enough) break
    }
    // Prefer exercises near the person's level when that still leaves a choice.
    const near = found.filter((e) => e.level >= profile.level - 1)
    return near.length >= 2 ? near : found
  }

  // Activation for the person's conditions. Cardio is left to the warm-up and the cardio slot.
  const helpful = EXERCISES.filter(
    (e) =>
      e.sections.includes('adapted') &&
      e.slot !== 'cardio' &&
      safe(e) &&
      e.helps?.some((c: ConditionId) => conditions.includes(c)),
  )

  const buildSession = (kind: SessionKind, day: number, block: number): { exercises: Exercise[]; prepCount: number } => {
    const slots = [...SLOTS[kind]]
    // Full-body days alternate the single-leg slot with overhead work.
    if (kind === 'full' && day % 2 === 1) slots[4] = 'overhead'
    // A Pilates session is core-centred and closes with a stretch.
    if (profile.place === 'pilates') slots.push('core', 'mobility')
    // Martial arts always end with a technique round: its striking drills are the cardio.
    const lowerDay = kind !== 'upper' && kind !== 'push' && kind !== 'pull'
    if (profile.place === 'mma' || profile.goal === 'lose' || (profile.goal === 'maintain' && lowerDay)) {
      slots.push('cardio')
    }

    const chosen: Exercise[] = []
    for (let i = 0; i < Math.min(helpful.length, 2); i++) {
      const pick = helpful[(seed + day + block + i) % helpful.length]
      if (!chosen.includes(pick)) chosen.push(pick)
    }
    const prepCount = chosen.length

    slots.forEach((slot, position) => {
      const options = candidates(slot)
      for (let attempt = 0; attempt < options.length; attempt++) {
        const pick = options[(seed + day + block * 2 + position + attempt) % options.length]
        if (!chosen.includes(pick)) {
          chosen.push(pick)
          return
        }
      }
    })
    return { exercises: chosen, prepCount }
  }

  const split = SPLITS[days]
  const weeks: Week[] = FOCUS.map((focus, week) => ({
    focus,
    sessions: split.map((kind, day) => {
      const { exercises, prepCount } = buildSession(kind, day, Math.floor(week / 2))
      return {
        id: `w${week + 1}d${day + 1}`,
        kind,
        items: exercises.map((e, i): PlanItem => {
          if (i < prepCount) {
            return { exerciseId: e.id, sets: 1, amount: e.unit === 'secs' ? 30 : 10, unit: e.unit, restSec: 20, prep: true }
          }
          return { exerciseId: e.id, ...dose(e, profile, week, fragile) }
        }),
      }
    }),
  }))

  return { month, cycle, place: profile.place, goal: profile.goal, level: profile.level, weeks }
}

/** Rough session length in minutes: work time plus rests, plus warm-up and cool-down. */
export function estimateMinutes(session: Session): number {
  const seconds = session.items.reduce((sum, item) => {
    const work = item.unit === 'secs' ? item.amount : item.amount * 4
    return sum + item.sets * (work + item.restSec)
  }, 0)
  return Math.round(seconds / 60) + 8
}

export function planProgress(plan: MonthPlan): { done: number; total: number } {
  const sessions = plan.weeks.flatMap((w) => w.sessions)
  return { done: sessions.filter((s) => s.doneAt).length, total: sessions.length }
}
