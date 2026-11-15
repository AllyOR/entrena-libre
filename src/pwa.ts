import { registerSW } from 'virtual:pwa-register'
import { isBusy } from './lib/updates'

/**
 * Keeps an open or installed app on the latest published version.
 *
 * The service worker serves the app from its cache, so without this a new version
 * shows only on the second visit after it is published. Here the page reloads itself
 * as soon as the new version has taken over, except during a workout, where it waits
 * until the person leaves the session.
 */
export function startUpdates(): void {
  let waiting = false
  const reloadWhenIdle = () => {
    if (waiting && !isBusy(window.location.hash)) window.location.reload()
  }

  registerSW({
    immediate: true,
    onNeedReload() {
      waiting = true
      reloadWhenIdle()
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // An installed app can stay open for days: look for a new version each time it comes back into view.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => {})
      })
    },
  })

  window.addEventListener('hashchange', reloadWhenIdle)
}
