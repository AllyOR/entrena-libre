import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import {
  bmi,
  bmiCategory,
  bmr,
  bodyFatPct,
  calorieTarget,
  effectiveConditions,
  healthyWeightRange,
  macros,
  suggestMenu,
  tdee,
  waterLiters,
} from './nutrition'

const man: Profile = {
  name: 'Test',
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
  level: 2,
  place: 'gym',
  daysPerWeek: 3,
  conditions: [],
}
const woman: Profile = { ...man, sex: 'female', heightCm: 165, weightKg: 60 }

describe('body mass index', () => {
  it('divides weight by height squared', () => {
    expect(bmi(80, 180)).toBe(24.7)
    expect(bmi(95, 170)).toBe(32.9)
  })

  it('uses the WHO categories, with the boundary in the higher one', () => {
    expect(bmiCategory(18.4)).toBe('under')
    expect(bmiCategory(18.5)).toBe('normal')
    expect(bmiCategory(24.9)).toBe('normal')
    expect(bmiCategory(25)).toBe('over')
    expect(bmiCategory(30)).toBe('obese1')
    expect(bmiCategory(35)).toBe('obese2')
    expect(bmiCategory(40)).toBe('obese3')
  })

  it('gives the weight range for a BMI of 18.5 to 24.9', () => {
    expect(healthyWeightRange(180)).toEqual([59.9, 80.7])
  })
})

describe('energy', () => {
  it('computes basal metabolic rate with Mifflin-St Jeor', () => {
    expect(bmr(man)).toBe(1780)
    expect(bmr(woman)).toBe(1320)
  })

  it('multiplies by the activity factor', () => {
    expect(tdee(man)).toBe(2759)
    expect(tdee({ ...man, activity: 'sedentary' })).toBe(2136)
  })

  it('cuts 20% to lose, adds 10% to gain, rounded to 10 kcal', () => {
    expect(calorieTarget(man)).toBe(2760)
    expect(calorieTarget({ ...man, goal: 'lose' })).toBe(2210)
    expect(calorieTarget({ ...man, goal: 'gain' })).toBe(3030)
  })

  it('never goes below a safe floor', () => {
    const small: Profile = { ...woman, age: 60, heightCm: 155, weightKg: 50, activity: 'sedentary', goal: 'lose' }
    expect(calorieTarget(small)).toBe(1200)
    expect(calorieTarget({ ...small, sex: 'male' })).toBe(1500)
  })

  it('does not apply a deficit during pregnancy', () => {
    const pregnant: Profile = { ...woman, goal: 'lose', conditions: ['pregnancy'] }
    expect(calorieTarget(pregnant)).toBeGreaterThanOrEqual(tdee(pregnant))
  })

  it('splits the target into macros that add back up to it', () => {
    const m = macros({ ...man, goal: 'lose' })
    const kcal = m.protein * 4 + m.carbs * 4 + m.fat * 9
    expect(Math.abs(kcal - 2210)).toBeLessThan(15)
    expect(m.protein).toBe(144)
  })

  it('suggests 35 ml of water per kg', () => {
    expect(waterLiters(80)).toBe(2.8)
  })
})

describe('body fat (US Navy method)', () => {
  it('needs waist and neck, and hip for women', () => {
    expect(bodyFatPct(man)).toBeNull()
    expect(bodyFatPct({ ...woman, waistCm: 75, neckCm: 33 })).toBeNull()
  })

  it('matches the published formula', () => {
    expect(bodyFatPct({ ...man, waistCm: 85, neckCm: 38 })).toBeCloseTo(16.1, 0)
    expect(bodyFatPct({ ...woman, waistCm: 75, neckCm: 33, hipCm: 98 })).toBeCloseTo(28.4, 0)
  })
})

describe('conditions derived from the numbers', () => {
  it('adds obesity from a BMI of 30 and senior from age 65', () => {
    expect(effectiveConditions(man)).toEqual([])
    expect(effectiveConditions({ ...man, weightKg: 100, age: 70, conditions: ['knee'] })).toEqual([
      'knee',
      'obesity',
      'senior',
    ])
  })
})

describe('menu suggestion', () => {
  it('returns one dish per meal, close to the calorie target', () => {
    const menu = suggestMenu(2200, [], 0)
    expect(menu.map((m) => m.dish.type)).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
    const total = menu.reduce((sum, m) => sum + m.kcal, 0)
    expect(Math.abs(total - 2200)).toBeLessThan(2200 * 0.12)
  })

  it('changes with the day', () => {
    const ids = (day: number) => suggestMenu(2200, [], day).map((m) => m.dish.id)
    expect(ids(0)).not.toEqual(ids(1))
  })

  it('keeps to low-glycaemic dishes for diabetes and low-sodium ones for hypertension', () => {
    for (let day = 0; day < 10; day++) {
      for (const item of suggestMenu(1800, ['diabetes', 'hypertension'], day)) {
        expect(item.dish.tags).toContain('lowGi')
        expect(item.dish.tags).toContain('lowSodium')
      }
    }
  })
})
