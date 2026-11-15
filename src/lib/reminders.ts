/** Workout reminders: the saved setting and the weekly notifications it stands for. Pure. */

export interface Reminders {
  enabled: boolean
  /** Local time, `HH:MM`. */
  time: string
  /** Days of the week, 0 Sunday to 6 Saturday. */
  days: number[]
}

export const DEFAULT_REMINDERS: Reminders = { enabled: false, time: '18:00', days: [1, 3, 5] }

export interface WeeklyNotification {
  /** Stable per weekday, so rescheduling replaces instead of piling up. */
  id: number
  /** 1 Sunday to 7 Saturday, as the notification plugin counts them. */
  weekday: number
  hour: number
  minute: number
}

/** Every id a reminder can have: used to cancel them all before rescheduling. */
export const REMINDER_IDS = [1, 2, 3, 4, 5, 6, 7]

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function parseReminders(v: unknown): Reminders {
  if (!isRec(v) || typeof v.time !== 'string' || !TIME.test(v.time) || !Array.isArray(v.days)) return DEFAULT_REMINDERS
  const days = [0, 1, 2, 3, 4, 5, 6].filter((d) => (v.days as unknown[]).includes(d))
  return { enabled: v.enabled === true && days.length > 0, time: v.time, days }
}

/** The weekly notifications for a setting: none when it is off. */
export function weeklyNotifications(r: Reminders): WeeklyNotification[] {
  const match = TIME.exec(r.time)
  if (!r.enabled || !match) return []
  const [hour, minute] = [Number(match[1]), Number(match[2])]
  return [...new Set(r.days)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b)
    .map((d) => ({ id: d + 1, weekday: d + 1, hour, minute }))
}

/**
 * When the next reminder is due, strictly after `now`, in local time. Null when
 * reminders are off. Used by the browser, which has no way to schedule a weekly
 * notification and must set a timer for the next one.
 */
export function nextReminderAt(r: Reminders, now: Date): Date | null {
  const wanted = weeklyNotifications(r)
  if (wanted.length === 0) return null
  const { hour, minute } = wanted[0]
  const days = new Set(wanted.map((n) => n.weekday - 1))
  for (let ahead = 0; ahead <= 7; ahead++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead, hour, minute, 0, 0)
    if (days.has(at.getDay()) && at.getTime() > now.getTime()) return at
  }
  return null
}
