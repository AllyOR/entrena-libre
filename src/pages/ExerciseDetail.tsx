import { Icon } from '../components/Icon'
import { LevelDots } from '../components/ExerciseCard'
import { Paywall } from '../components/Paywall'
import { exerciseById } from '../data/exercises'
import { Figure } from '../figure/Figure'
import { POSES } from '../figure/poses'
import { DISCIPLINE_KEY, LEVEL_KEY, MUSCLE_KEY, SECTION_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { tipsFor, type Tip } from '../lib/personalize'
import { lockedExercise } from '../lib/premium'
import { href } from '../router'
import { usePremium } from '../state/premium'
import { useStore } from '../state/store'
import type { Exercise } from '../types'

export function TipList({ tips }: { tips: Tip[] }) {
  const { l } = useI18n()
  return (
    <ul className="tips">
      {tips.map((tip) => (
        <li key={tip.id} className={`tip ${tip.kind}`}>
          <Icon name={tip.kind === 'info' ? 'info' : 'alert'} size={18} />
          <span>{l(tip.text)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Technique, mistakes and breathing: shared by the detail page and the workout player. */
export function Technique({ exercise }: { exercise: Exercise }) {
  const { t, l, lang } = useI18n()
  return (
    <>
      <h2>{t('technique')}</h2>
      <ol className="steps">
        {exercise.steps[lang].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <h2>{t('mistakes')}</h2>
      <ul className="mistakes">
        {exercise.mistakes[lang].map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <h2>{t('breathing')}</h2>
      <p>{l(exercise.breathing)}</p>
    </>
  )
}

export function ExerciseDetail({ id }: { id?: string }) {
  const { t, l } = useI18n()
  const { profile, units } = useStore().state
  const premium = usePremium()
  const exercise = id ? exerciseById(id) : undefined

  if (!exercise) {
    return (
      <>
        <h1>{t('notFound')}</h1>
        <a className="btn" href={href('exercises')}>
          {t('explore')}
        </a>
      </>
    )
  }

  if (lockedExercise(exercise, premium)) {
    return (
      <article className="detail">
        <button type="button" className="link-back" onClick={() => window.history.back()}>
          <Icon name="chevronLeft" size={18} /> {t('back')}
        </button>
        <h1>{l(exercise.name)}</h1>
        <Paywall compact />
      </article>
    )
  }

  const tips = profile ? tipsFor(exercise, profile, units) : []
  return (
    <article className="detail">
      <button type="button" className="link-back" onClick={() => window.history.back()}>
        <Icon name="chevronLeft" size={18} /> {t('back')}
      </button>
      <h1>{l(exercise.name)}</h1>
      <p className="tags">
        {exercise.sections.map((s) => (
          <span key={s} className="tag">
            {t(SECTION_KEY[s])}
          </span>
        ))}
        {exercise.discipline && <span className="tag">{t(DISCIPLINE_KEY[exercise.discipline])}</span>}
        <span className="tag">{t(MUSCLE_KEY[exercise.muscle])}</span>
        <span className="tag">
          <LevelDots level={exercise.level} /> {t(LEVEL_KEY[exercise.level])}
        </span>
        <span className="tag">{t(exercise.impact === 'high' ? 'impactHigh' : 'impactLow')}</span>
        {exercise.perSide && <span className="tag">{t('perSide')}</span>}
      </p>

      <div className="detail-grid">
        <div>
          <div className="figure-frame">
            <Figure
              pose={exercise.pose}
              gear={exercise.gear}
              label={l(exercise.name)}
              animated
              pauseLabel={t('pause')}
              playLabel={t('play')}
            />
            {POSES[exercise.pose].hold && <p className="muted small center">{t('holdNote')}</p>}
          </div>
          <p>
            <strong>{t('equipment')}:</strong> {l(exercise.equipment)}
          </p>
          <section className="card for-you">
            <h2>{t('forYou')}</h2>
            {!profile && (
              <p>
                {t('forYouEmpty')} <a href={href('profile')}>{t('start')}</a>
              </p>
            )}
            {profile && tips.length === 0 && <p>{t('forYouOk')}</p>}
            {tips.length > 0 && <TipList tips={tips} />}
          </section>
        </div>
        <div>
          <Technique exercise={exercise} />
        </div>
      </div>
    </article>
  )
}
