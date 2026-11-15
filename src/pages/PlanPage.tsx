import { useState } from 'react'
import { Icon } from '../components/Icon'
import { exerciseById } from '../data/exercises'
import { FOCUS_KEY, GOAL_KEY, KIND_KEY, LEVEL_KEY, SECTION_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { addMonths, formatMonth, monthKey } from '../lib/dates'
import { estimateMinutes, planProgress, type MonthPlan, type PlanItem, type Session } from '../lib/plan'
import { href } from '../router'
import { useStore } from '../state/store'

/** "3 × 12 rep." or "3 × 30 s", plus "por lado" for unilateral exercises. */
export function Dose({ item }: { item: PlanItem }) {
  const { t } = useI18n()
  const exercise = exerciseById(item.exerciseId)
  return (
    <span className="dose">
      {item.sets} × {t(item.unit === 'secs' ? 'secs' : 'reps', { n: item.amount })}
      {exercise?.perSide ? ` ${t('perSide')}` : ''}
    </span>
  )
}

export function NeedProfile() {
  const { t } = useI18n()
  return (
    <section className="card empty">
      <h2>{t('needProfile')}</h2>
      <p>{t('needProfileText')}</p>
      <a className="btn primary" href={href('profile')}>
        {t('start')}
      </a>
    </section>
  )
}

function SessionCard({ plan, session, day }: { plan: MonthPlan; session: Session; day: number }) {
  const { t, l } = useI18n()
  const { completeSession, uncompleteSession } = useStore()
  const done = Boolean(session.doneAt)
  return (
    <section className={`card session${done ? ' done' : ''}`}>
      <header className="session-head">
        <h3>
          {t('day', { n: day })} · {t(KIND_KEY[session.kind])}
        </h3>
        {done ? (
          <span className="badge ok">
            <Icon name="check" size={14} /> {t('done')}
          </span>
        ) : (
          <span className="muted small">
            <Icon name="clock" size={14} /> {t('minutes', { n: estimateMinutes(session) })}
          </span>
        )}
      </header>
      <ol className="session-items">
        {session.items.map((item) => {
          const exercise = exerciseById(item.exerciseId)
          if (!exercise) return null
          return (
            <li key={item.exerciseId}>
              <a href={href('exercise', exercise.id)}>{l(exercise.name)}</a>
              {item.prep && <span className="tag small">{t('prep')}</span>}
              <Dose item={item} />
            </li>
          )
        })}
      </ol>
      <div className="row">
        {done ? (
          <button type="button" className="btn" onClick={() => uncompleteSession(plan.month, session.id)}>
            {t('undo')}
          </button>
        ) : (
          <>
            <a className="btn primary" href={href('workout', plan.month, session.id)}>
              {t('startSession')}
            </a>
            <button type="button" className="btn" onClick={() => completeSession(plan.month, session.id, 0)}>
              {t('markDone')}
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export function PlanPage() {
  const { t, lang } = useI18n()
  const { state, createPlan } = useStore()
  const current = monthKey()
  const [month, setMonth] = useState(current)
  const { profile, plans } = state
  const plan = plans[month]

  const earliest = Object.keys(plans).sort()[0] ?? current
  const canPrev = month > earliest
  const canNext = month <= current
  const monthName = formatMonth(month, lang)

  const stale = plan && profile && (plan.place !== profile.place || plan.goal !== profile.goal || plan.level !== profile.level)
  const progress = plan ? planProgress(plan) : null
  // Open the first week that still has sessions to do.
  const openWeek = plan ? Math.max(plan.weeks.findIndex((w) => w.sessions.some((s) => !s.doneAt)), 0) : 0

  const regenerate = () => {
    if (!progress?.done || window.confirm(t('regenerateConfirm'))) createPlan(month)
  }

  return (
    <>
      <h1>{t('planTitle')}</h1>
      <div className="month-nav">
        <button type="button" className="icon-btn" disabled={!canPrev} onClick={() => setMonth(addMonths(month, -1))} aria-label={t('prevMonth')}>
          <Icon name="chevronLeft" />
        </button>
        <strong aria-live="polite">{formatMonth(month, lang, 'title')}</strong>
        <button type="button" className="icon-btn" disabled={!canNext} onClick={() => setMonth(addMonths(month, 1))} aria-label={t('nextMonth')}>
          <Icon name="chevronRight" />
        </button>
      </div>

      {!profile && <NeedProfile />}

      {profile && !plan && (
        <section className="card empty">
          <p>{month >= current ? t('noPlanYet', { month: monthName }) : t('noPlanMonth')}</p>
          {month >= current && (
            <button type="button" className="btn primary" onClick={() => createPlan(month)}>
              {t('createPlan', { month: monthName })}
            </button>
          )}
        </section>
      )}

      {profile && plan && progress && (
        <>
          <div className="plan-summary">
            <div>
              <p className="muted">
                {t('planFor', { place: t(SECTION_KEY[plan.place]), goal: t(GOAL_KEY[plan.goal]), level: t(LEVEL_KEY[plan.level]) })}
              </p>
              <p>
                <strong>{t('sessionsOf', progress)}</strong>
              </p>
              <progress value={progress.done} max={progress.total} aria-label={t('sessionsOf', progress)} />
            </div>
            <button type="button" className="btn" onClick={regenerate}>
              <Icon name="refresh" size={16} /> {t('regenerate')}
            </button>
          </div>
          {stale && <p className="note warn">{t('planStale')}</p>}
          <p className="note muted small">
            {t('warmup')} {t('cooldown')} <a href={href('exercises', 'stretch')}>{t('cooldownLink')}</a>
          </p>

          {plan.weeks.map((week, w) => (
            <details key={w} className="week" open={w === openWeek}>
              <summary>
                <span className="week-title">{t('week', { n: w + 1 })}</span>
                <span className="muted">{t(FOCUS_KEY[week.focus])}</span>
                <span className="muted small">
                  {week.sessions.filter((s) => s.doneAt).length}/{week.sessions.length}
                </span>
              </summary>
              <div className="session-grid">
                {week.sessions.map((session, d) => (
                  <SessionCard key={session.id} plan={plan} session={session} day={d + 1} />
                ))}
              </div>
            </details>
          ))}
        </>
      )}
    </>
  )
}
