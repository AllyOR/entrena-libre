import { useState } from 'react'
import type { MessageKey } from '../i18n/es'
import { useI18n } from '../i18n/useI18n'
import type { PurchaseResult } from '../lib/purchases'
import { href } from '../router'
import { usePremium } from '../state/premium'
import { Icon } from './Icon'

const BENEFITS: MessageKey[] = ['premiumPilates', 'premiumMma', 'premiumMenus', 'premiumRegenerate']

const RESULT_TEXT: Partial<Record<PurchaseResult, MessageKey>> = {
  purchased: 'premiumThanks',
  nothing: 'premiumNothingToRestore',
  unavailable: 'premiumUnavailable',
  error: 'premiumError',
}

/**
 * The offer to buy Premium, once and for good. `compact` is the card shown in place of
 * locked content, with a link to the full page; the full page lists what it includes.
 */
export function Paywall({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const { entitled, price, canBuy, buy, restore } = usePremium()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PurchaseResult | null>(null)

  const run = (action: () => Promise<PurchaseResult>) => async () => {
    setBusy(true)
    setResult(await action())
    setBusy(false)
  }

  if (entitled) {
    return (
      <section className="card paywall owned">
        <h2>
          <Icon name="check" size={18} /> {t('premiumOwned')}
        </h2>
        <p>{t('premiumThanks')}</p>
      </section>
    )
  }

  const message = result && RESULT_TEXT[result]
  return (
    <section className="card paywall">
      <h2>
        <Icon name="lock" size={18} /> {t('premiumTitle')}
      </h2>
      <p>{t('premiumPitch')}</p>
      {compact ? (
        <a className="btn primary" href={href('premium')}>
          {t('premiumSee')}
        </a>
      ) : (
        <>
          <ul className="benefits">
            {BENEFITS.map((key) => (
              <li key={key}>
                <Icon name="check" size={16} /> {t(key)}
              </li>
            ))}
          </ul>
          {!canBuy && <p className="note muted small">{t('premiumUnavailable')}</p>}
          <div className="row">
            <button type="button" className="btn primary big" disabled={busy || !canBuy} onClick={run(buy)}>
              {price ? t('premiumBuyFor', { price }) : t('premiumBuy')}
            </button>
            <button type="button" className="btn" disabled={busy || !canBuy} onClick={run(restore)}>
              {t('premiumRestore')}
            </button>
          </div>
          <p className="muted small">{t('premiumOnce')}</p>
        </>
      )}
      {message && (
        <p className={`note ${result === 'purchased' ? 'ok' : 'danger'}`} role="status">
          {t(message)}
        </p>
      )}
    </section>
  )
}
