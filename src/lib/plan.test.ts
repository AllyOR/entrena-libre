import { describe, expect, it } from 'vitest'
import { exerciseById } from '../data/exercises'
import type { ConditionId, Place, Profile } from '../types'
import { generatePlan, type MonthPlan } from './plan'

const base: Profile = {
  name: 'Test',
  sex: 'female',
  age: 30,
  heightCm: 165,
  weightKg: 60,
  activity: 'light',
  goal: 'maintain',
  level: 2,
  place: 'gym',
  daysPerWeek: 3,
  conditions: [],
}

const idsOf = (plan: MonthPlan) => plan.weeks.flatMap((w) => w.sessions.flatMap((s) => s.items.map((i) => i.exerciseId)))
const exercisesOf = (plan: MonthPlan) =>
  idsOf(plan).map((id) => {
    const found = exerciseById(id)
    if (!found) throw new Error(`Plan references an unknown exercise: ${id}`)
    return found
  })

describe('generatePlan', () => {
  it('builds four weeks with the requested sessions per week', () => {
    for (const days of [2, 3, 4, 5, 6]) {
      const plan = generatePlan({ ...base, daysPerWeek: days }, '2026-11', 0)
      expect(plan.weeks).toHaveLength(4)
      for (const week of plan.weeks) expect(week.sessions).toHaveLength(days)
    }
  })

  it('is deterministic for a month and cycle, and varies between months', () => {
    expect(generatePlan(base, '2026-11', 0)).toEqual(generatePlan(base, '2026-11', 0))
    expect(idsOf(generatePlan(base, '2026-11', 0))).not.toEqual(idsOf(generatePlan(base, '2026-12', 1)))
  })

  it('repeats a block for two weeks, then changes exercises', () => {
    const [w1, w2, w3] = generatePlan(base, '2026-11', 0).weeks
    const ids = (w: typeof w1) => w.sessions.map((s) => s.items.map((i) => i.exerciseId))
    expect(ids(w2)).toEqual(ids(w1))
    expect(ids(w3)).not.toEqual(ids(w1))
  })

  it('never repeats an exercise inside a session', () => {
    for (const place of ['gym', 'functional', 'home'] as Place[]) {
      for (const days of [2, 4, 6]) {
        const plan = generatePlan({ ...base, place, daysPerWeek: days }, '2026-11', 0)
        for (const session of plan.weeks.flatMap((w) => w.sessions)) {
          const ids = session.items.map((i) => i.exerciseId)
          expect(new Set(ids).size).toBe(ids.length)
          expect(ids.length).toBeGreaterThanOrEqual(4)
        }
      }
    }
  })

  it('never asks for gym or box equipment at home', () => {
    for (const conditions of [[], ['knee', 'hypertension'], ['shoulder', 'wrist', 'lowerBack']] as ConditionId[][]) {
      const plan = generatePlan({ ...base, place: 'home', level: 1, goal: 'lose', weightKg: 85, conditions }, '2026-11', 0)
      for (const e of exercisesOf(plan)) {
        const atHome = e.sections.includes('home') || e.sections.includes('adapted') || e.gear === 'none'
        expect(atHome, e.id).toBe(true)
      }
    }
  })

  it('stays at or below the profile level', () => {
    const plan = generatePlan({ ...base, level: 1, place: 'functional' }, '2026-11', 0)
    for (const e of exercisesOf(plan)) expect(e.level).toBe(1)
  })

  it('leaves out every exercise contraindicated for the profile', () => {
    const sets: ConditionId[][] = [
      ['knee'],
      ['lowerBack', 'shoulder'],
      ['pregnancy'],
      ['heart', 'hypertension'],
      ['knee', 'lowerBack', 'shoulder', 'wrist', 'heart', 'osteoporosis'],
    ]
    for (const conditions of sets) {
      for (const place of ['gym', 'functional', 'home'] as Place[]) {
        const plan = generatePlan({ ...base, place, conditions }, '2026-11', 0)
        for (const e of exercisesOf(plan)) {
          expect(e.avoid.filter((c) => conditions.includes(c)), `${e.id} for ${conditions.join()}`).toEqual([])
        }
        for (const session of plan.weeks.flatMap((w) => w.sessions)) {
          expect(session.items.length).toBeGreaterThanOrEqual(4)
        }
      }
    }
  })

  it('treats a BMI of 30 or more as a condition: no high-impact exercise', () => {
    const plan = generatePlan({ ...base, weightKg: 95, goal: 'lose', place: 'functional' }, '2026-11', 0)
    for (const e of exercisesOf(plan)) expect(e.avoid).not.toContain('obesity')
  })

  it('opens each session with exercises that help the profile’s conditions', () => {
    const plan = generatePlan({ ...base, conditions: ['lowerBack'] }, '2026-11', 0)
    for (const session of plan.weeks.flatMap((w) => w.sessions)) {
      const first = session.items[0]
      expect(first.prep).toBe(true)
      expect(exerciseById(first.exerciseId)?.helps).toContain('lowerBack')
    }
  })

  it('adds cardio when the goal is to lose weight', () => {
    const plan = generatePlan({ ...base, goal: 'lose' }, '2026-11', 0)
    for (const session of plan.weeks.flatMap((w) => w.sessions)) {
      const slots = session.items.map((i) => exerciseById(i.exerciseId)?.slot)
      expect(slots).toContain('cardio')
    }
  })

  it('progresses the volume through week 3 and deloads in week 4', () => {
    const plan = generatePlan(base, '2026-11', 0)
    const volume = (week: number) =>
      plan.weeks[week].sessions[0].items.filter((i) => !i.prep && i.unit === 'reps').reduce((sum, i) => sum + i.sets * i.amount, 0)
    expect(plan.weeks.map((w) => w.focus)).toEqual(['base', 'volume', 'intensity', 'deload'])
    expect(volume(1)).toBeGreaterThan(volume(0))
    expect(volume(2)).toBeGreaterThan(volume(1))
    expect(volume(3)).toBeLessThan(volume(2))
  })
})
