import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isoDate } from '../lib/dates'
import { applyStatusBar } from '../lib/native'
import { estimateMinutes, generatePlan, type MonthPlan, type Session } from '../lib/plan'
import { STORAGE_KEY, defaultState, parseState, upsertMeasurement, type AppState } from '../lib/storage'
import { defaultUnits } from '../lib/units'
import type { Lang } from '../types'
import { StoreContext, type Store } from './store'

function initialState(): AppState {
  const lang: Lang = navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
  const theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const fallback = defaultState(lang, theme, defaultUnits(navigator.language))
  try {
    return parseState(localStorage.getItem(STORAGE_KEY), fallback) ?? fallback
  } catch {
    // Storage blocked (private mode): the app still works, without saving.
    return fallback
  }
}

const mapSession = (plan: MonthPlan, id: string, change: (s: Session) => Session): MonthPlan => ({
  ...plan,
  weeks: plan.weeks.map((w) => ({ ...w, sessions: w.sessions.map((s) => (s.id === id ? change(s) : s)) })),
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    document.documentElement.lang = state.lang
    document.documentElement.dataset.theme = state.theme
    void applyStatusBar(state.theme)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked: keep working with the state in memory.
    }
  }, [state])

  const store = useMemo<Store>(() => {
    const updatePlan = (month: string, change: (plan: MonthPlan) => MonthPlan) =>
      setState((s) => (s.plans[month] ? { ...s, plans: { ...s.plans, [month]: change(s.plans[month]) } } : s))

    return {
      state,
      setLang: (lang) => setState((s) => ({ ...s, lang })),
      toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setUnits: (units) => setState((s) => ({ ...s, units })),
      saveProfile: (profile) =>
        setState((s) => ({
          ...s,
          profile,
          measurements: upsertMeasurement(s.measurements, {
            date: isoDate(),
            weightKg: profile.weightKg,
            waistCm: profile.waistCm,
          }),
        })),
      createPlan: (month) =>
        setState((s) => {
          if (!s.profile) return s
          const existing = s.plans[month]
          const cycle = existing ? existing.cycle + 1 : Object.keys(s.plans).length
          return { ...s, plans: { ...s.plans, [month]: generatePlan(s.profile, month, cycle) } }
        }),
      completeSession: (month, id, minutes) =>
        updatePlan(month, (plan) =>
          mapSession(plan, id, (session) => ({ ...session, doneAt: isoDate(), minutes: minutes || estimateMinutes(session) })),
        ),
      uncompleteSession: (month, id) =>
        updatePlan(month, (plan) => mapSession(plan, id, ({ doneAt: _doneAt, minutes: _minutes, ...session }) => session)),
      addMeasurement: (m) => setState((s) => ({ ...s, measurements: upsertMeasurement(s.measurements, m) })),
      removeMeasurement: (date) => setState((s) => ({ ...s, measurements: s.measurements.filter((m) => m.date !== date) })),
      setReminders: (reminders) => setState((s) => ({ ...s, reminders })),
      replaceAll: (next) => setState(next),
      reset: () => setState((s) => defaultState(s.lang, s.theme, s.units)),
    }
  }, [state])

  return <StoreContext value={store}>{children}</StoreContext>
}
