import type { MonthPlan } from './plan'

export interface MonthStats {
  month: string
  done: number
  total: number
  minutes: number
}

/** Per-month totals, oldest first. */
export function monthStats(plans: Record<string, MonthPlan>): MonthStats[] {
  return Object.values(plans)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((plan) => {
      const sessions = plan.weeks.flatMap((w) => w.sessions)
      const finished = sessions.filter((s) => s.doneAt)
      return {
        month: plan.month,
        done: finished.length,
        total: sessions.length,
        minutes: finished.reduce((sum, s) => sum + (s.minutes ?? 0), 0),
      }
    })
}

const DAY = 86_400_000
/** Weeks since a fixed Monday, for a local `YYYY-MM-DD` date. */
const weekIndex = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number)
  // 1970-01-05 was a Monday.
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(1970, 0, 5)) / (7 * DAY))
}

/**
 * Consecutive calendar weeks (Monday to Sunday) with at least one completed session,
 * counting back from this week. A week still in progress does not break the streak.
 */
export function weekStreak(plans: Record<string, MonthPlan>, today: string): number {
  const weeks = new Set(
    Object.values(plans).flatMap((p) => p.weeks.flatMap((w) => w.sessions.flatMap((s) => (s.doneAt ? [weekIndex(s.doneAt)] : [])))),
  )
  let week = weekIndex(today)
  if (!weeks.has(week)) week -= 1
  let streak = 0
  while (weeks.has(week)) {
    streak += 1
    week -= 1
  }
  return streak
}
