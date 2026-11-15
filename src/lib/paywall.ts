/**
 * Whether this build sells Premium. The native (store) builds do. The website stays
 * fully open: it has no way to charge. `VITE_PAYWALL=1` turns the paywall on in a web
 * build, to work on its screens in a browser.
 */
export const PAYWALL_ENABLED: boolean = import.meta.env.MODE === 'native' || import.meta.env.VITE_PAYWALL === '1'

/** RevenueCat's public SDK keys, one per store. Set at build time; see `.env.example`. */
export const STORE_KEYS = {
  ios: (import.meta.env.VITE_RC_IOS_KEY as string | undefined) ?? '',
  android: (import.meta.env.VITE_RC_ANDROID_KEY as string | undefined) ?? '',
}

/** The entitlement that the one-time purchase grants, as named in RevenueCat. */
export const ENTITLEMENT = 'premium'
