import { Ring } from '../components/charts'
import { Icon } from '../components/Icon'
import { lockedSection } from '../lib/premium'
import { usePremium } from '../state/premium'
import { exercisesIn } from '../data/exercises'
import { Figure } from '../figure/Figure'
import { BMI_KEY, KIND_KEY, SECTIONS, SECTION_DESC_KEY, SECTION_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { formatMonth, monthKey } from '../lib/dates'
import { bmi, bmiCategory, calorieTarget } from '../lib/nutrition'
import { estimateMinutes, planProgress } from '../lib/plan'
import { href } from '../router'
import { useStore } from '../state/store'
import type { Gear, PoseId, Section } from '../types'

const SECTION_ART: Record<Section, { pose: PoseId; gear: Gear }> = {
  gym: { pose: 'barSquat', gear: 'barbell' },
  functional: { pose: 'swing', gear: 'kettlebell' },
  home: { pose: 'inclinePushup', gear: 'none' },
  adapted: { pose: 'birdDog', gear: 'none' },
  pilates: { pose: 'teaser', gear: 'none' },
  mma: { pose: 'roundKick', gear: 'none' },
  stretch: { pose: 'hipFlexorStretch', gear: 'none' },
}

function SectionCards() {
  const { t } = useI18n()
  const premium = usePremium()
  return (
    <>
      <h2>{t('sections')}</h2>
      <div className="section-grid">
        {SECTIONS.map((s) => (
          <a key={s} className="card section-card" href={href('exercises', s)}>
            <Figure pose={SECTION_ART[s].pose} gear={SECTION_ART[s].gear} label="" />
            <span>
              <strong>
                {t(SECTION_KEY[s])}
                {lockedSection(s, premium) && (
                  <span className="lock" title={t('premiumLocked')}>
                    <Icon name="lock" size={13} />
                  </span>
                )}
              </strong>
              <span className="muted small">{t(SECTION_DESC_KEY[s])}</span>
              <span className="muted small">{t('exercisesCount', { n: exercisesIn(s).length })}</span>
            </span>
          </a>
        ))}
      </div>
    </>
  )
}

export function Home() {
  const { t, lang, n } = useI18n()
  const { state, createPlan } = useStore()
  const { profile } = state

  if (!profile) {
    return (
      <>
        <section className="hero">
          <div>
            <h1>{t('heroTitle')}</h1>
            <p className="lead">{t('heroText')}</p>
            <div className="row">
              <a className="btn primary big" href={href('profile')}>
                {t('start')}
              </a>
              <a className="btn big" href={href('exercises')}>
                {t('explore')}
              </a>
            </div>
          </div>
          <div className="figure-frame hero-art">
            <Figure pose="squat" gear="none" label="" animated />
          </div>
        </section>
        <SectionCards />
        <p className="note muted small">{t('disclaimer')}</p>
      </>
    )
  }

  const month = monthKey()
  const monthName = formatMonth(month, lang)
  const plan = state.plans[month]
  const progress = plan ? planProgress(plan) : null
  const next = plan?.weeks.flatMap((w) => w.sessions).find((s) => !s.doneAt)
  const bodyMass = bmi(profile.weightKg, profile.heightCm)

  return (
    <>
      <h1>{profile.name ? t('hello', { name: profile.name }) : t('helloAnon')}</h1>
      <div className="home-grid">
        <section className="card accent">
          <h2>{t('nextSession')}</h2>
          {!plan && (
            <>
              <p>{t('noPlanYet', { month: monthName })}</p>
              <button type="button" className="btn primary" onClick={() => createPlan(month)}>
                {t('createPlan', { month: monthName })}
              </button>
            </>
          )}
          {plan && next && (
            <>
              <p className="next-title">{t(KIND_KEY[next.kind])}</p>
              <p className="muted">
                <Icon name="clock" size={14} /> {t('minutes', { n: estimateMinutes(next) })} · {t('exercisesN', { n: next.items.length })}
              </p>
              <div className="row">
                <a className="btn primary" href={href('workout', month, next.id)}>
                  {t('startSession')}
                </a>
                <a className="btn" href={href('plan')}>
                  {t('seeDetails')}
                </a>
              </div>
            </>
          )}
          {plan && !next && <p>{t('monthDone')}</p>}
        </section>

        {progress && (
          <a className="card stat-card" href={href('progress')}>
            <Ring value={progress.total ? progress.done / progress.total : 0} label={t('sessionsOf', progress)} />
            <span>
              <strong>{t('monthProgress', { month: monthName })}</strong>
              <span className="muted">{t('sessionsOf', progress)}</span>
            </span>
          </a>
        )}

        <a className="card stat-card" href={href('nutrition')}>
          <span className="numbers">
            <span>
              <span className="big-number">{n(bodyMass)}</span>
              <span className="muted small">
                {t('bmi')} · {t(BMI_KEY[bmiCategory(bodyMass)])}
              </span>
            </span>
            <span>
              <span className="big-number">{n(calorieTarget(profile))}</span>
              <span className="muted small">{t('dailyKcal')}</span>
            </span>
          </span>
        </a>
      </div>
      <SectionCards />
    </>
  )
}
