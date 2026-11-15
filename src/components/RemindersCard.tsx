import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { isNative, remindersSupported, sendTestReminder, syncReminders } from '../lib/native'
import type { Reminders } from '../lib/reminders'
import { useStore } from '../state/store'

/** Monday first, as weeks are shown in Spanish and in most of the world. */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

/**
 * Workout reminders. Turning them on asks the device for notification permission.
 * The Android and iOS apps schedule them with the system; a browser shows them only
 * while the app is open or in the background.
 */
export function RemindersCard() {
  const { t, lang } = useI18n()
  const { state, setReminders } = useStore()
  const { reminders } = state
  const [status, setStatus] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null)
  const supported = remindersSupported()
  const text = { title: t('reminderNotice'), body: t('reminderBody') }

  // 2024-01-07 was a Sunday: day 0.
  const dayName = (day: number) => new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2024, 0, 7 + day))

  const update = async (next: Reminders) => {
    setReminders(next)
    const result = await syncReminders(next, text)
    if (result === 'denied') {
      setReminders({ ...next, enabled: false })
      setStatus({ kind: 'danger', text: t('remindersDenied') })
    } else if (result === 'unsupported') {
      setReminders({ ...next, enabled: false })
      setStatus({ kind: 'danger', text: t('remindersUnsupported') })
    } else if (result === 'scheduled') setStatus({ kind: 'ok', text: t('remindersOn') })
    else setStatus({ kind: 'ok', text: t('remindersOff') })
  }
  const toggleDay = (day: number) => {
    const days = reminders.days.includes(day) ? reminders.days.filter((d) => d !== day) : [...reminders.days, day]
    void update({ ...reminders, days, enabled: reminders.enabled && days.length > 0 })
  }
  const test = async () => {
    const result = await sendTestReminder(text)
    if (result === 'scheduled') setStatus({ kind: 'ok', text: t('remindersTestSent') })
    else setStatus({ kind: 'danger', text: t(result === 'denied' ? 'remindersDenied' : 'remindersUnsupported') })
  }

  return (
    <section className="card">
      <h2>{t('remindersTitle')}</h2>
      <p>{t('remindersText')}</p>
      {!supported && <p className="note warn small">{t('remindersUnsupported')}</p>}
      {supported && !isNative() && <p className="note muted small">{t('remindersWebNote')}</p>}
      <fieldset className="plain" disabled={!supported}>
        <label className="check">
          <input
            type="checkbox"
            checked={reminders.enabled}
            onChange={(e) => void update({ ...reminders, enabled: e.target.checked && reminders.days.length > 0 })}
          />
          {t('remindersEnable')}
        </label>
        <label>
          {t('remindersTime')}
          <input type="time" value={reminders.time} onChange={(e) => e.target.value && void update({ ...reminders, time: e.target.value })} />
        </label>
        <div className="field">
          <span>{t('remindersDays')}</span>
          <div className="chips">
            {DAY_ORDER.map((day) => (
              <button key={day} type="button" className="chip" aria-pressed={reminders.days.includes(day)} onClick={() => toggleDay(day)}>
                {dayName(day)}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn" onClick={() => void test()}>
          {t('remindersTest')}
        </button>
      </fieldset>
      {status && (
        <p className={`note ${status.kind}`} role="status">
          {status.text}
        </p>
      )}
    </section>
  )
}
