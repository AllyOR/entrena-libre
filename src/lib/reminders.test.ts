import { describe, expect, it } from 'vitest'
import { DEFAULT_REMINDERS, REMINDER_IDS, parseReminders, weeklyNotifications } from './reminders'

describe('weeklyNotifications', () => {
  it('schedules nothing while reminders are off', () => {
    expect(weeklyNotifications(DEFAULT_REMINDERS)).toEqual([])
  })

  it('gives one notification per chosen day, Sunday counted as 1', () => {
    expect(weeklyNotifications({ enabled: true, time: '07:05', days: [5, 0, 1] })).toEqual([
      { id: 1, weekday: 1, hour: 7, minute: 5 },
      { id: 2, weekday: 2, hour: 7, minute: 5 },
      { id: 6, weekday: 6, hour: 7, minute: 5 },
    ])
  })

  it('ignores duplicate and impossible days and a malformed time', () => {
    expect(weeklyNotifications({ enabled: true, time: '18:00', days: [3, 3, 9, -1] }).map((n) => n.weekday)).toEqual([4])
    expect(weeklyNotifications({ enabled: true, time: '25:00', days: [1] })).toEqual([])
  })

  it('only ever uses ids that a reschedule cancels', () => {
    const all = weeklyNotifications({ enabled: true, time: '06:30', days: [0, 1, 2, 3, 4, 5, 6] })
    expect(all.map((n) => n.id)).toEqual(REMINDER_IDS)
  })
})

describe('parseReminders', () => {
  it('keeps a valid setting', () => {
    expect(parseReminders({ enabled: true, time: '06:30', days: [6, 2] })).toEqual({ enabled: true, time: '06:30', days: [2, 6] })
  })

  it('falls back to the default for anything malformed', () => {
    expect(parseReminders(undefined)).toEqual(DEFAULT_REMINDERS)
    expect(parseReminders({ enabled: true, time: '6pm', days: [1] })).toEqual(DEFAULT_REMINDERS)
    expect(parseReminders({ enabled: true, time: '06:30', days: 'mon' })).toEqual(DEFAULT_REMINDERS)
  })

  it('turns reminders off when no valid day is left', () => {
    expect(parseReminders({ enabled: true, time: '06:30', days: [8] })).toEqual({ enabled: false, time: '06:30', days: [] })
  })
})
