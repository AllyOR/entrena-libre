import { Icon } from '../components/Icon'
import { Paywall } from '../components/Paywall'
import { useI18n } from '../i18n/useI18n'

export function PremiumPage() {
  const { t } = useI18n()
  return (
    <article className="prose">
      <button type="button" className="link-back" onClick={() => window.history.back()}>
        <Icon name="chevronLeft" size={18} /> {t('back')}
      </button>
      <h1>{t('premiumHeading')}</h1>
      <Paywall />
      <p className="note muted small">{t('premiumFreeNote')}</p>
    </article>
  )
}
