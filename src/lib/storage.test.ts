import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import { generatePlan } from './plan'
import { defaultState, parseProfile, parseState, upsertMeasurement, type AppState } from './storage'

const profile: Profile = {
  name: 'Ana',
  sex: 'female',
  age: 34,
  heightCm: 162,
  weightKg: 64,
  activity: 'light',
  goal: 'lose',
  level: 1,
  place: 'home',
  daysPerWeek: 3,
  conditions: ['knee'],
}
const fallback = defaultState('es', 'light')

describe('parseProfile', () => {
  it('accepts a complete profile', () => {
    expect(parseProfile(profile)).toEqual({ ...profile, waistCm: undefined, neckCm: undefined, hipCm: undefined })
  })

  it('rejects missing or out-of-range required fields', () => {
    expect(parseProfile({ ...profile, age: 5 })).toBeNull()
    expect(parseProfile({ ...profile, heightCm: '162' })).toBeNull()
    expect(parseProfile({ ...profile, goal: 'bulk' })).toBeNull()
    expect(parseProfile(null)).toBeNull()
  })

  it('drops unknown and derived conditions and out-of-range optional measurements', () => {
    const parsed = parseProfile({ ...profile, conditions: ['knee', 'obesity', 'dragon'], waistCm: 9999 })
    expect(parsed?.conditions).toEqual(['knee'])
    expect(parsed?.waistCm).toBeUndefined()
  })
})

describe('parseState', () => {
  const saved: AppState = {
    ...fallback,
    lang: 'en',
    theme: 'dark',
    profile,
    plans: { '2026-11': generatePlan(profile, '2026-11', 0) },
    measurements: [{ date: '2026-11-01', weightKg: 64 }],
  }

  it('round-trips a saved state', () => {
    const parsed = parseState(JSON.stringify(saved), fallback)
    expect(parsed?.lang).toBe('en')
    expect(parsed?.theme).toBe('dark')
    expect(parsed?.plans['2026-11']).toEqual(saved.plans['2026-11'])
    expect(parsed?.measurements).toEqual([{ date: '2026-11-01', weightKg: 64, waistCm: undefined }])
  })

  it('returns null for anything that is not this app’s data', () => {
    expect(parseState(null, fallback)).toBeNull()
    expect(parseState('not json', fallback)).toBeNull()
    expect(parseState('{"v":2}', fallback)).toBeNull()
    expect(parseState('[1,2]', fallback)).toBeNull()
  })

  it('repairs a damaged state instead of failing', () => {
    const plan = structuredClone(saved.plans['2026-11'])
    plan.weeks[0].sessions[0].items[0].exerciseId = 'gym-removed-exercise'
    const damaged = { v: 1, lang: 'fr', profile: { ...profile, age: -1 }, plans: { a: plan, b: { month: 'x' } }, measurements: 'no' }
    const parsed = parseState(JSON.stringify(damaged), fallback)
    expect(parsed?.lang).toBe('es')
    expect(parsed?.profile).toBeNull()
    expect(Object.keys(parsed?.plans ?? {})).toEqual(['2026-11'])
    expect(parsed?.plans['2026-11'].weeks[0].sessions[0].items).toHaveLength(saved.plans['2026-11'].weeks[0].sessions[0].items.length - 1)
    expect(parsed?.measurements).toEqual([])
  })
})

describe('upsertMeasurement', () => {
  it('keeps one measurement per date, sorted', () => {
    const list = upsertMeasurement([{ date: '2026-11-10', weightKg: 80 }], { date: '2026-11-01', weightKg: 81 })
    expect(list.map((m) => m.date)).toEqual(['2026-11-01', '2026-11-10'])
    expect(upsertMeasurement(list, { date: '2026-11-10', weightKg: 79 })).toEqual([
      { date: '2026-11-01', weightKg: 81 },
      { date: '2026-11-10', weightKg: 79 },
    ])
  })
})
