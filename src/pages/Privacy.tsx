import type { MessageKey } from '../i18n/es'
import { useI18n } from '../i18n/useI18n'

const ISSUES_URL = 'https://github.com/AllyOR/training-app/issues'

const SECTIONS: [MessageKey, MessageKey][] = [
  ['privacyStoredTitle', 'privacyStored'],
  ['privacyWhereTitle', 'privacyWhere'],
  ['privacyPermissionsTitle', 'privacyPermissions'],
  ['privacyPurchasesTitle', 'privacyPurchases'],
  ['privacyControlTitle', 'privacyControl'],
  ['privacyHealthTitle', 'privacyHealth'],
]

/** The privacy policy the app stores link to. It describes what the code does: keep it true. */
export function Privacy() {
  const { t } = useI18n()
  return (
    <article className="prose">
      <h1>{t('privacyTitle')}</h1>
      <p className="muted small">{t('privacyUpdated')}</p>
      {SECTIONS.map(([title, body]) => (
        <section key={title}>
          <h2>{t(title)}</h2>
          <p>{t(body)}</p>
        </section>
      ))}
      <h2>{t('privacyContactTitle')}</h2>
      <p>
        {t('privacyContact')}{' '}
        <a href={ISSUES_URL} target="_blank" rel="noreferrer">
          {ISSUES_URL}
        </a>
      </p>
    </article>
  )
}
