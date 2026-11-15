import { Figure } from '../figure/Figure'
import { DISCIPLINE_KEY, LEVEL_KEY, MUSCLE_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { statusFor, type Status } from '../lib/personalize'
import { href } from '../router'
import { useStore } from '../state/store'
import type { Exercise, Level } from '../types'

export function LevelDots({ level }: { level: Level }) {
  const { t } = useI18n()
  return (
    <span className="level">
      <span className="sr-only">
        {t('level')}: {t(LEVEL_KEY[level])}
      </span>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= level ? 'dot on' : 'dot'} aria-hidden="true" />
      ))}
    </span>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n()
  if (status === 'ok') return null
  return <span className={`badge ${status}`}>{t(status === 'avoid' ? 'statusAvoid' : 'statusCaution')}</span>
}

/** A library entry: thumbnail figure, name and the facts needed to choose. */
export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { t, l } = useI18n()
  const { profile } = useStore().state
  const status = profile ? statusFor(exercise, profile) : 'ok'
  return (
    <a className={`ex-card${status === 'avoid' ? ' dim' : ''}`} href={href('exercise', exercise.id)}>
      <Figure pose={exercise.pose} gear={exercise.gear} label="" />
      <span className="ex-card-body">
        <span className="ex-card-name">{l(exercise.name)}</span>
        <span className="ex-card-meta">
          {t(exercise.discipline ? DISCIPLINE_KEY[exercise.discipline] : MUSCLE_KEY[exercise.muscle])} · {l(exercise.equipment)}
        </span>
        <span className="ex-card-foot">
          <LevelDots level={exercise.level} />
          <StatusBadge status={status} />
        </span>
      </span>
    </a>
  )
}
