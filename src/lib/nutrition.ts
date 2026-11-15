/**
 * Body metrics and energy needs. Pure functions over a `Profile`.
 *
 * Sources: WHO BMI categories; Mifflin-St Jeor (1990) for basal metabolic rate, the
 * equation with the best accuracy in non-athletes; US Navy circumference method
 * (Hodgdon and Beckett, 1984) for body fat. All are population estimates.
 */
import { DISHES, type Dish, type MealType } from '../data/meals'
import type { Activity, ConditionId, Goal, Profile } from '../types'

const round = (value: number, decimals = 0) => {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return round(weightKg / (m * m), 1)
}

export type BmiCategory = 'under' | 'normal' | 'over' | 'obese1' | 'obese2' | 'obese3'

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'under'
  if (value < 25) return 'normal'
  if (value < 30) return 'over'
  if (value < 35) return 'obese1'
  if (value < 40) return 'obese2'
  return 'obese3'
}

/** Weight range, in kg, for a BMI between 18.5 and 24.9. */
export function healthyWeightRange(heightCm: number): [number, number] {
  const m2 = (heightCm / 100) ** 2
  return [round(18.5 * m2, 1), round(24.9 * m2, 1)]
}

/** Basal metabolic rate in kcal/day (Mifflin-St Jeor). */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  return Math.round(base + (p.sex === 'male' ? 5 : -161))
}

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
}

/** Total daily energy expenditure in kcal/day. */
export function tdee(p: Profile): number {
  return Math.round(bmr(p) * ACTIVITY_FACTOR[p.activity])
}

const GOAL_FACTOR: Record<Goal, number> = { lose: 0.8, maintain: 1, gain: 1.1 }
const CALORIE_FLOOR = { female: 1200, male: 1500 } as const

/** Daily calorie target for the goal, rounded to 10 kcal, never below a safe floor. */
export function calorieTarget(p: Profile): number {
  // No deficit during pregnancy: weight loss then is a medical decision.
  const factor = p.conditions.includes('pregnancy') ? Math.max(GOAL_FACTOR[p.goal], 1) : GOAL_FACTOR[p.goal]
  const target = Math.round((tdee(p) * factor) / 10) * 10
  return Math.max(target, CALORIE_FLOOR[p.sex])
}

export interface Macros {
  protein: number
  carbs: number
  fat: number
}

const PROTEIN_PER_KG: Record<Goal, number> = { lose: 1.8, maintain: 1.4, gain: 1.8 }

/** Daily grams of protein, carbohydrate and fat for the calorie target. */
export function macros(p: Profile): Macros {
  const kcal = calorieTarget(p)
  // Protein follows lean mass, not total mass: above the healthy range, use its top.
  const reference = Math.min(p.weightKg, healthyWeightRange(p.heightCm)[1] * 1.1)
  const protein = Math.round(reference * PROTEIN_PER_KG[p.goal])
  const fat = Math.round((kcal * 0.27) / 9)
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 0)
  return { protein, carbs, fat }
}

export const waterLiters = (weightKg: number): number => round(weightKg * 0.035, 1)

/** Body fat percentage by the US Navy method, or null when a measurement is missing. */
export function bodyFatPct(p: Profile): number | null {
  if (!p.waistCm || !p.neckCm) return null
  const h = Math.log10(p.heightCm)
  if (p.sex === 'male') {
    if (p.waistCm <= p.neckCm) return null
    return round(495 / (1.0324 - 0.19077 * Math.log10(p.waistCm - p.neckCm) + 0.15456 * h) - 450, 1)
  }
  if (!p.hipCm || p.waistCm + p.hipCm <= p.neckCm) return null
  return round(495 / (1.29579 - 0.35004 * Math.log10(p.waistCm + p.hipCm - p.neckCm) + 0.221 * h) - 450, 1)
}

/** Waist divided by height. Above 0.5 signals higher cardiometabolic risk. */
export function waistToHeight(p: Profile): number | null {
  return p.waistCm ? round(p.waistCm / p.heightCm, 2) : null
}

/** The profile's chosen conditions plus the ones its numbers imply. */
export function effectiveConditions(p: Profile): ConditionId[] {
  const all = new Set<ConditionId>(p.conditions)
  if (bmi(p.weightKg, p.heightCm) >= 30) all.add('obesity')
  if (p.age >= 65) all.add('senior')
  return [...all]
}

export interface MenuItem {
  dish: Dish
  /** Multiple of the dish's base portion, in quarters. */
  portion: number
  kcal: number
}

const MEAL_SHARE: [MealType, number][] = [
  ['breakfast', 0.25],
  ['lunch', 0.35],
  ['dinner', 0.25],
  ['snack', 0.15],
]

/** One dish per meal for a calorie target, rotating with `day`, filtered for the conditions. */
export function suggestMenu(targetKcal: number, conditions: readonly ConditionId[], day: number): MenuItem[] {
  const allowed = (d: Dish) =>
    (!conditions.includes('diabetes') || d.tags.includes('lowGi')) &&
    (!conditions.includes('hypertension') || d.tags.includes('lowSodium'))

  return MEAL_SHARE.map(([type, share], i) => {
    const ofType = DISHES.filter((d) => d.type === type)
    const pool = ofType.filter(allowed)
    const options = pool.length ? pool : ofType
    // Every meal advances one dish a day; the offset keeps the meals out of step.
    const dish = options[(day + i * 3) % options.length]
    const portion = Math.min(Math.max(Math.round(((targetKcal * share) / dish.kcal) * 4) / 4, 0.75), 2.5)
    return { dish, portion, kcal: Math.round(dish.kcal * portion) }
  })
}
