import { createContext, useContext } from 'react'
import type { PremiumStatus } from '../lib/premium'
import type { PurchaseResult } from '../lib/purchases'

export interface Premium extends PremiumStatus {
  /** True when nothing is locked: no paywall in this build, or Premium is owned. */
  unlocked: boolean
  /** The store's localized price, when known. */
  price: string | null
  /** Whether a purchase can be made here: false in a browser. */
  canBuy: boolean
  buy(): Promise<PurchaseResult>
  restore(): Promise<PurchaseResult>
}

export const PremiumContext = createContext<Premium | null>(null)

export function usePremium(): Premium {
  const premium = useContext(PremiumContext)
  if (!premium) throw new Error('usePremium must be used inside <PremiumProvider>')
  return premium
}
