/**
 * The only module that talks to the native shell (Capacitor). In a browser every
 * function here is a no-op or a web fallback, and the plugins are never loaded.
 */
import { Capacitor } from '@capacitor/core'
import { REMINDER_IDS, nextReminderAt, weeklyNotifications, type Reminders } from './reminders'

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

interface ReminderText {
  title: string
  body: string
}

/** Browsers can show notifications only with the Notification API; iPhone has it only in an installed web app. */
const webNotifications = (): boolean => typeof Notification !== 'undefined'

/** Whether this device can deliver reminders at all. */
export const remindersSupported = (): boolean => isNative() || webNotifications()

async function showWebNotification(text: ReminderText): Promise<void> {
  const options = { body: text.body, icon: './icon-192.png', tag: 'workout-reminder' }
  try {
    // Phones only allow notifications through the service worker; a desktop tab without one can show them directly.
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) await registration.showNotification(text.title, options)
    else new Notification(text.title, options)
  } catch {
    // Blocked or unsupported at this moment: nothing to show.
  }
}

let webTimer: number | undefined

/**
 * Browser reminders: a timer for the next one, while the app is open or in the
 * background. A browser cannot wake a closed page, so these are best effort; the
 * Android and iOS apps schedule them with the system instead.
 */
function scheduleWeb(reminders: Reminders, text: ReminderText): void {
  window.clearTimeout(webTimer)
  const next = nextReminderAt(reminders, new Date())
  if (!next) return
  // Timers cap at about 24 days: a week away is always within range.
  webTimer = window.setTimeout(() => {
    void showWebNotification(text)
    scheduleWeb(reminders, text)
  }, next.getTime() - Date.now())
}

/**
 * Replaces the scheduled workout reminders with the ones the setting asks for.
 * Asks for notification permission the first time reminders are turned on.
 */
export async function syncReminders(reminders: Reminders, text: ReminderText): Promise<ReminderResult> {
  if (!isNative()) {
    if (!webNotifications()) return 'unsupported'
    if (weeklyNotifications(reminders).length === 0) {
      window.clearTimeout(webTimer)
      return 'off'
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'
    scheduleWeb(reminders, text)
    return 'scheduled'
  }
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

/**
 * Restarts the browser's reminder timer when the app opens. Never asks for permission:
 * it only resumes what the person already allowed. The native apps need nothing here.
 */
export function resumeWebReminders(reminders: Reminders, text: ReminderText): void {
  if (isNative() || !webNotifications()) return
  if (Notification.permission === 'granted') scheduleWeb(reminders, text)
}

/** Shows a notification now, so the person can see that reminders reach them. */
export async function sendTestReminder(text: ReminderText): Promise<ReminderResult> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      let permission = await LocalNotifications.checkPermissions()
      if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
      if (permission.display !== 'granted') return 'denied'
      await LocalNotifications.schedule({
        notifications: [{ id: 99, title: text.title, body: text.body, schedule: { at: new Date(Date.now() + 2000) } }],
      })
      return 'scheduled'
    } catch {
      return 'unsupported'
    }
  }
  if (!webNotifications()) return 'unsupported'
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'
  await showWebNotification(text)
  return 'scheduled'
}
