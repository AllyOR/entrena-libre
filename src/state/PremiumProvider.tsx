import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PAYWALL_ENABLED } from '../lib/paywall'
import { isUnlocked } from '../lib/premium'
import { buyPremium, loadStore, purchasesAvailable, restorePremium } from '../lib/purchases'
import { PremiumContext, type Premium } from './premium'

/** Knows whether Premium is owned. Asks the store when the app starts; never reads it from saved data. */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const [entitled, setEntitled] = useState(false)
  const [price, setPrice] = useState<string | null>(null)

  useEffect(() => {
    if (!PAYWALL_ENABLED) return
    let cancelled = false
    void loadStore().then((store) => {
      if (cancelled || !store) return
      setEntitled(store.entitled)
      setPrice(store.price)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const premium = useMemo<Premium>(() => {
    const status = { enabled: PAYWALL_ENABLED, entitled }
    const settle = (action: () => ReturnType<typeof buyPremium>) => async () => {
      const result = await action()
      if (result === 'purchased') setEntitled(true)
      return result
    }
    return {
      ...status,
      unlocked: isUnlocked(status),
      price,
      canBuy: purchasesAvailable(),
      buy: settle(buyPremium),
      restore: settle(restorePremium),
    }
  }, [entitled, price])

  return <PremiumContext value={premium}>{children}</PremiumContext>
}
