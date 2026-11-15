import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import { generatePlan, type MonthPlan } from './plan'
import { monthStats, weekStreak } from './stats'

const profile: Profile = {
  name: '',
  sex: 'male',
  age: 40,
  heightCm: 175,
  weightKg: 78,
  activity: 'light',
  goal: 'maintain',
  level: 1,
  place: 'home',
  daysPerWeek: 3,
  conditions: [],
}

/** A plan with its first `dates.length` sessions completed on the given dates. */
function planWith(month: string, dates: string[]): MonthPlan {
  const plan = generatePlan(profile, month, 0)
  const sessions = plan.weeks.flatMap((w) => w.sessions)
  dates.forEach((date, i) => {
    sessions[i].doneAt = date
    sessions[i].minutes = 30
  })
  return plan
}

describe('monthStats', () => {
  it('totals sessions and minutes per month, oldest first', () => {
    const plans = {
      '2026-11': planWith('2026-11', ['2026-11-02', '2026-11-04']),
      '2026-10': planWith('2026-10', ['2026-10-05']),
    }
    expect(monthStats(plans)).toEqual([
      { month: '2026-10', done: 1, total: 12, minutes: 30 },
      { month: '2026-11', done: 2, total: 12, minutes: 60 },
    ])
  })
})

describe('weekStreak', () => {
  // 2026-11-02 is a Monday.
  it('counts consecutive weeks with a session, across months', () => {
    const plans = {
      '2026-10': planWith('2026-10', ['2026-10-20', '2026-10-28']),
      '2026-11': planWith('2026-11', ['2026-11-03', '2026-11-10']),
    }
    expect(weekStreak(plans, '2026-11-12')).toBe(4)
  })

  it('is not broken by a current week with no session yet', () => {
    const plans = { '2026-11': planWith('2026-11', ['2026-11-03']) }
    expect(weekStreak(plans, '2026-11-09')).toBe(1)
  })

  it('resets after a full week off', () => {
    const plans = { '2026-11': planWith('2026-11', ['2026-11-03']) }
    expect(weekStreak(plans, '2026-11-16')).toBe(0)
    expect(weekStreak({}, '2026-11-16')).toBe(0)
  })
})
