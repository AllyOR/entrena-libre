import { createContext, useContext } from 'react'
import type { Lang, Profile } from '../types'
import type { Reminders } from '../lib/reminders'
import type { AppState, Measurement } from '../lib/storage'

export interface Store {
  state: AppState
  setLang(lang: Lang): void
  toggleTheme(): void
  /** Saves the profile and logs its weight as today's measurement. */
  saveProfile(profile: Profile): void
  /** Creates the month's plan, or a new variation when one exists. */
  createPlan(month: string): void
  completeSession(month: string, sessionId: string, minutes: number): void
  uncompleteSession(month: string, sessionId: string): void
  addMeasurement(m: Measurement): void
  removeMeasurement(date: string): void
  setReminders(reminders: Reminders): void
  /** Replaces everything with a restored backup. */
  replaceAll(state: AppState): void
  reset(): void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
