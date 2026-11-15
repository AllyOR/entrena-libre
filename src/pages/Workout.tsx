import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { exerciseById } from '../data/exercises'
import { Figure } from '../figure/Figure'
import { KIND_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { buzz } from '../lib/native'
import { tipsFor } from '../lib/personalize'
import type { PlanItem } from '../lib/plan'
import { href } from '../router'
import { useStore } from '../state/store'
import type { Exercise } from '../types'
import { Technique, TipList } from './ExerciseDetail'
import { Dose } from './PlanPage'

/** Counts down from `seconds`, starting when the component mounts; calls `onEnd` once at zero. */
function useCountdown(seconds: number, onEnd: () => void): number {
  const [left, setLeft] = useState(seconds)
  const end = useRef(onEnd)
  useEffect(() => {
    end.current = onEnd
  })

  useEffect(() => {
    // Deadline-based, so a throttled background tab still ends on time.
    const deadline = Date.now() + seconds * 1000
    const id = window.setInterval(() => {
      const remaining = Math.max(Math.ceil((deadline - Date.now()) / 1000), 0)
      setLeft(remaining)
      if (remaining === 0) {
        window.clearInterval(id)
        void buzz()
        end.current()
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [seconds])

  return left
}

/** Whole minutes since a timestamp, at least one. Called from event handlers only. */
const elapsedMinutes = (since: number) => Math.max(Math.round((Date.now() - since) / 60_000), 1)

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Countdown({ seconds, onEnd, showBar = false }: { seconds: number; onEnd: () => void; showBar?: boolean }) {
  const left = useCountdown(seconds, onEnd)
  return (
    <>
      <span className="big-number" role="timer">
        {clock(left)}
      </span>
      {showBar && <progress value={seconds - left} max={seconds} />}
    </>
  )
}

function Rest({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  const { t } = useI18n()
  return (
    <section className="card rest" aria-live="polite">
      <h2>{t('restTitle')}</h2>
      <Countdown seconds={seconds} onEnd={onEnd} showBar />
      <button type="button" className="btn" onClick={onEnd}>
        {t('skipRest')}
      </button>
    </section>
  )
}

/** For exercises dosed in seconds: a timer for the set itself. */
function HoldTimer({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  const { t } = useI18n()
  const [running, setRunning] = useState(false)
  return running ? (
    <div className="hold-timer">
      <Countdown seconds={seconds} onEnd={onEnd} />
      <button type="button" className="btn" onClick={() => setRunning(false)}>
        {t('stopTimer')}
      </button>
    </div>
  ) : (
    <button type="button" className="btn" onClick={() => setRunning(true)}>
      <Icon name="clock" size={16} /> {t('startTimer', { n: seconds })}
    </button>
  )
}

interface Step {
  item: PlanItem
  exercise: Exercise
}

export function Workout({ month, sessionId }: { month?: string; sessionId?: string }) {
  const { t, l } = useI18n()
  const { state, completeSession } = useStore()
  const plan = month ? state.plans[month] : undefined
  const session = plan?.weeks.flatMap((w) => w.sessions).find((s) => s.id === sessionId)

  const [index, setIndex] = useState(0)
  const [setNo, setSetNo] = useState(1)
  const [phase, setPhase] = useState<'work' | 'rest' | 'finished'>('work')
  const [minutes, setMinutes] = useState(0)
  const [startedAt] = useState(() => Date.now())

  const steps: Step[] = (session?.items ?? []).flatMap((item) => {
    const exercise = exerciseById(item.exerciseId)
    return exercise ? [{ item, exercise }] : []
  })

  if (!plan || !session || !month || steps.length === 0) {
    return (
      <section className="card empty">
        <p>{t('noPlanMonth')}</p>
        <a className="btn primary" href={href('plan')}>
          {t('backToPlan')}
        </a>
      </section>
    )
  }

  if (phase === 'finished') {
    return (
      <section className="card empty finished">
        <span className="big-check">
          <Icon name="check" size={40} />
        </span>
        <h1>{t('finished')}</h1>
        <p>{t('finishedText', { min: minutes })}</p>
        <a className="btn primary" href={href('plan')}>
          {t('backToPlan')}
        </a>
      </section>
    )
  }

  const { item, exercise } = steps[index]
  const lastExercise = index === steps.length - 1
  const lastSet = setNo >= item.sets

  const finish = () => {
    const spent = elapsedMinutes(startedAt)
    setMinutes(spent)
    completeSession(month, session.id, spent)
    setPhase('finished')
  }
  const goTo = (next: number) => {
    setIndex(next)
    setSetNo(1)
    setPhase('work')
  }
  const setDone = () => {
    if (lastSet && lastExercise) finish()
    else setPhase('rest')
  }
  const afterRest = () => {
    if (lastSet) goTo(index + 1)
    else {
      setSetNo(setNo + 1)
      setPhase('work')
    }
  }

  const tips = state.profile ? tipsFor(exercise, state.profile, state.units).filter((tip) => tip.kind !== 'info') : []

  return (
    <div className="workout">
      <header className="workout-head">
        <a className="link-back" href={href('plan')}>
          <Icon name="chevronLeft" size={18} /> {t('quit')}
        </a>
        <span className="muted">
          {t(KIND_KEY[session.kind])} · {t('exerciseOf', { i: index + 1, n: steps.length })}
        </span>
      </header>
      <progress value={index + (setNo - 1) / item.sets} max={steps.length} aria-label={t('exerciseOf', { i: index + 1, n: steps.length })} />

      <h1>{l(exercise.name)}</h1>
      <p className="workout-dose">
        <Dose item={item} /> · {t('rest', { n: item.restSec })}
        {item.prep && <span className="tag small">{t('prep')}</span>}
      </p>

      <div className="detail-grid">
        <div>
          <div className="figure-frame">
            <Figure
              key={exercise.id}
              pose={exercise.pose}
              gear={exercise.gear}
              label={l(exercise.name)}
              animated
              pauseLabel={t('pause')}
              playLabel={t('play')}
            />
          </div>
          <p className="muted small center">{l(exercise.equipment)}</p>
        </div>

        <div>
          {phase === 'rest' ? (
            <Rest key={`${index}-${setNo}`} seconds={item.restSec} onEnd={afterRest} />
          ) : (
            <section className="card set-card">
              <p className="set-count" aria-live="polite">
                {t('setOf', { i: setNo, n: item.sets })}
              </p>
              <div className="set-dots" aria-hidden="true">
                {Array.from({ length: item.sets }, (_, i) => (
                  <span key={i} className={i < setNo - 1 ? 'dot on' : i === setNo - 1 ? 'dot now' : 'dot'} />
                ))}
              </div>
              {item.unit === 'secs' && <HoldTimer key={`${index}-${setNo}`} seconds={item.amount} onEnd={setDone} />}
              <button type="button" className="btn primary big" onClick={setDone}>
                <Icon name="check" size={18} /> {lastSet && lastExercise ? t('finish') : t('setDone')}
              </button>
            </section>
          )}

          {tips.length > 0 && <TipList tips={tips} />}

          <details className="technique">
            <summary>{t('technique')}</summary>
            <Technique exercise={exercise} />
          </details>
        </div>
      </div>

      <div className="row between">
        <button type="button" className="btn" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <Icon name="chevronLeft" size={16} /> {t('previous')}
        </button>
        {lastExercise ? (
          <button type="button" className="btn" onClick={finish}>
            {t('finish')}
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => goTo(index + 1)}>
            {t('next')} <Icon name="chevronRight" size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
