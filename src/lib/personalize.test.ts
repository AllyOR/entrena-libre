import { describe, expect, it } from 'vitest'
import { EXERCISES, exerciseById } from '../data/exercises'
import type { Exercise, Profile } from '../types'
import { SUBSTITUTE_SLOT, alternativeFor, startingLoadKg, statusFor, tipsFor } from './personalize'

const profile: Profile = {
  name: 'Test',
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 80,
  activity: 'light',
  goal: 'maintain',
  level: 1,
  place: 'gym',
  daysPerWeek: 3,
  conditions: [],
}

const must = (id: string): Exercise => {
  const e = exerciseById(id)
  if (!e) throw new Error(`Missing exercise ${id}`)
  return e
}
const withAvoid = (c: 'knee' | 'shoulder') => EXERCISES.filter((e) => e.avoid.includes(c))

describe('statusFor', () => {
  it('is ok without conditions, avoid or caution with them', () => {
    const risky = withAvoid('knee')[0]
    expect(statusFor(risky, profile)).toBe('ok')
    expect(statusFor(risky, { ...profile, conditions: ['knee'] })).toBe('avoid')
    const careful = EXERCISES.find((e) => e.caution.includes('knee'))
    expect(careful && statusFor(careful, { ...profile, conditions: ['knee'] })).toBe('caution')
  })

  it('counts the conditions derived from BMI and age', () => {
    const jump = EXERCISES.find((e) => e.avoid.includes('obesity'))
    expect(jump && statusFor(jump, { ...profile, weightKg: 100 })).toBe('avoid')
  })
})

describe('alternativeFor', () => {
  it('offers a safe exercise of the same or the substitute movement pattern for every contraindicated one', () => {
    for (const condition of ['knee', 'shoulder'] as const) {
      const p: Profile = { ...profile, conditions: [condition], level: 3 }
      for (const e of withAvoid(condition)) {
        const alt = alternativeFor(e, p)
        expect(alt, `${e.id} has no alternative`).toBeDefined()
        expect([e.slot, SUBSTITUTE_SLOT[e.slot]]).toContain(alt?.slot)
        expect(alt && statusFor(alt, p)).not.toBe('avoid')
      }
    }
  })
})

describe('tipsFor', () => {
  it('warns and names the alternative when the exercise is contraindicated', () => {
    const e = withAvoid('shoulder')[0]
    const tips = tipsFor(e, { ...profile, conditions: ['shoulder'] })
    expect(tips[0].kind).toBe('avoid')
    expect(tips[0].text.es).toContain(alternativeFor(e, { ...profile, conditions: ['shoulder'] })?.name.es)
  })

  it('gives the condition’s modification for an exercise marked with care', () => {
    const e = EXERCISES.find((x) => x.caution.includes('lowerBack'))
    const tips = e ? tipsFor(e, { ...profile, conditions: ['lowerBack'] }) : []
    expect(tips.some((t) => t.kind === 'caution' && t.text.es.startsWith('Lumbar'))).toBe(true)
  })

  it('adapts to level, height and age', () => {
    const squat = must('gym-barbell-back-squat')
    const kinds = (p: Profile) => tipsFor(squat, p).map((t) => t.id)
    expect(kinds(profile)).toContain('beginner')
    expect(kinds({ ...profile, level: 3 })).not.toContain('beginner')
    expect(kinds({ ...profile, heightCm: 190 })).toContain('tall')
    expect(kinds({ ...profile, heightCm: 175 })).not.toContain('tall')
  })
})

describe('startingLoadKg', () => {
  it('suggests a load only for gym weights, in 2.5 kg steps', () => {
    expect(startingLoadKg(must('ada-bird-dog'), profile)).toBeNull()
    const load = startingLoadKg(must('gym-barbell-back-squat'), profile)
    expect(load).not.toBeNull()
    expect((load as number) % 2.5).toBe(0)
    expect(load).toBeGreaterThanOrEqual(20)
  })

  it('scales with level and is lower for women', () => {
    const squat = must('gym-barbell-back-squat')
    const l1 = startingLoadKg(squat, profile) as number
    const l3 = startingLoadKg(squat, { ...profile, level: 3 }) as number
    const woman = startingLoadKg(squat, { ...profile, level: 3, sex: 'female' }) as number
    expect(l3).toBeGreaterThan(l1)
    expect(woman).toBeLessThan(l3)
  })
})
