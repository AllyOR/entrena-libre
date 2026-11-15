/**
 * The one-time Premium purchase, through RevenueCat, which talks to the App Store and
 * Google Play. Only the native apps can buy: in a browser every call reports
 * `unavailable`. The plugin is loaded on demand, never in a browser.
 *
 * Ownership is asked from the store each time the app starts (the SDK answers from its
 * cache when offline). It is deliberately not saved with the app's data: a backup file
 * is editable, and must not be a way to unlock Premium.
 */
import { Capacitor } from '@capacitor/core'
import { ENTITLEMENT, STORE_KEYS } from './paywall'

export type PurchaseResult = 'purchased' | 'cancelled' | 'nothing' | 'unavailable' | 'error'

export interface StoreStatus {
  entitled: boolean
  /** The localized price of Premium, as the store formats it. Null until the store answers. */
  price: string | null
}

const storeKey = (): string => {
  const platform = Capacitor.getPlatform()
  return platform === 'ios' ? STORE_KEYS.ios : platform === 'android' ? STORE_KEYS.android : ''
}

/** True where a purchase can actually be made: a native app built with its store key. */
export const purchasesAvailable = (): boolean => Capacitor.isNativePlatform() && storeKey() !== ''

let configured: Promise<typeof import('@revenuecat/purchases-capacitor').Purchases> | null = null

/** The configured plugin. Configures it once, on first use. */
function purchases() {
  configured ??= import('@revenuecat/purchases-capacitor').then(async ({ Purchases }) => {
    await Purchases.configure({ apiKey: storeKey() })
    return Purchases
  })
  return configured
}

const owns = (info: { entitlements: { active: Record<string, unknown> } }): boolean => ENTITLEMENT in info.entitlements.active

/** The package to sell: the offering's lifetime package, or its first one. */
async function premiumPackage() {
  const { current } = await (await purchases()).getOfferings()
  return current?.lifetime ?? current?.availablePackages[0] ?? null
}

/** Whether Premium is owned and what it costs. Null when purchases are unavailable or the store cannot be reached. */
export async function loadStore(): Promise<StoreStatus | null> {
  if (!purchasesAvailable()) return null
  try {
    const { customerInfo } = await (await purchases()).getCustomerInfo()
    const pack = await premiumPackage().catch(() => null)
    return { entitled: owns(customerInfo), price: pack?.product.priceString ?? null }
  } catch {
    return null
  }
}

export async function buyPremium(): Promise<PurchaseResult> {
  if (!purchasesAvailable()) return 'unavailable'
  try {
    const pack = await premiumPackage()
    if (!pack) return 'unavailable'
    const { customerInfo } = await (await purchases()).purchasePackage({ aPackage: pack })
    return owns(customerInfo) ? 'purchased' : 'error'
  } catch (error) {
    return (error as { userCancelled?: boolean } | null)?.userCancelled ? 'cancelled' : 'error'
  }
}

/** Recovers a purchase made before, on this or another device with the same store account. The stores require offering it. */
export async function restorePremium(): Promise<PurchaseResult> {
  if (!purchasesAvailable()) return 'unavailable'
  try {
    const { customerInfo } = await (await purchases()).restorePurchases()
    return owns(customerInfo) ? 'purchased' : 'nothing'
  } catch {
    return 'error'
  }
}
