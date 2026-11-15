/**
 * The only module that talks to the native shell (Capacitor). In a browser every
 * function here is a no-op or a web fallback, and the plugins are never loaded.
 */
import { Capacitor } from '@capacitor/core'
import { REMINDER_IDS, weeklyNotifications, type Reminders } from './reminders'

/** True inside the Android or iOS app, false in a browser. */
export const isNative = (): boolean => Capacitor.isNativePlatform()

/** A short buzz when a timer ends. */
export async function buzz(): Promise<void> {
  if (!isNative()) {
    navigator.vibrate?.(200)
    return
  }
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    // No haptics on this device: the on-screen timer is enough.
  }
}

/** Matches the system status bar's text colour to the app theme. */
export async function applyStatusBar(theme: 'light' | 'dark'): Promise<void> {
  if (!isNative()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // `Style.Dark` means light text, for a dark background.
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light })
  } catch {
    // Not supported on this device or OS version.
  }
}

export type ReminderResult = 'scheduled' | 'off' | 'denied' | 'unsupported'

/**
 * Replaces the scheduled workout reminders with the ones the setting asks for.
 * Asks for notification permission the first time reminders are turned on.
 */
export async function syncReminders(reminders: Reminders, text: { title: string; body: string }): Promise<ReminderResult> {
  if (!isNative()) return 'unsupported'
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: REMINDER_IDS.map((id) => ({ id })) })
    const wanted = weeklyNotifications(reminders)
    if (wanted.length === 0) return 'off'

    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return 'denied'

    await LocalNotifications.schedule({
      notifications: wanted.map(({ id, weekday, hour, minute }) => ({
        id,
        title: text.title,
        body: text.body,
        // Inexact on purpose: exact alarms need an extra Android permission a reminder does not justify.
        schedule: { on: { weekday, hour, minute } },
      })),
    })
    return 'scheduled'
  } catch {
    return 'unsupported'
  }
}
