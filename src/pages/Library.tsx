import { useState } from 'react'
import { ExerciseCard } from '../components/ExerciseCard'
import { CONDITIONS, SELECTABLE_CONDITIONS, conditionById, type Condition } from '../data/conditions'
import { EXERCISES, exercisesIn } from '../data/exercises'
import { MUSCLE_KEY, SECTIONS, SECTION_DESC_KEY, SECTION_KEY } from '../i18n/labels'
import type { MessageKey } from '../i18n/es'
import { useI18n } from '../i18n/useI18n'
import { effectiveConditions } from '../lib/nutrition'
import { href } from '../router'
import { useStore } from '../state/store'
import type { ConditionId, Muscle, Section } from '../types'

const isSection = (v: string | undefined): v is Section => SECTIONS.includes(v as Section)

export function Library({ section: raw }: { section?: string }) {
  const { t } = useI18n()
  const section: Section = isSection(raw) ? raw : 'gym'
  return (
    <>
      <h1>{t('libraryTitle')}</h1>
      <nav className="tabs" aria-label={t('sections')}>
        {SECTIONS.map((s) => (
          <a key={s} href={href('exercises', s)} className="tab" aria-current={s === section ? 'page' : undefined}>
            {t(SECTION_KEY[s])}
          </a>
        ))}
      </nav>
      <p className="lead">{t(SECTION_DESC_KEY[section])}</p>
      {section === 'adapted' ? <Adapted /> : <SectionList key={section} section={section} />}
    </>
  )
}

function SectionList({ section }: { section: Section }) {
  const { t } = useI18n()
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all')
  const all = exercisesIn(section)
  const muscles = [...new Set(all.map((e) => e.muscle))]
  const shown = muscle === 'all' ? all : all.filter((e) => e.muscle === muscle)
  return (
    <>
      <div className="chips" role="group" aria-label={t('mAll')}>
        {(['all', ...muscles] as const).map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={m === muscle} onClick={() => setMuscle(m)}>
            {t(m === 'all' ? 'mAll' : MUSCLE_KEY[m])}
          </button>
        ))}
      </div>
      <p className="muted small">{t('exercisesCount', { n: shown.length })}</p>
      <div className="ex-grid">
        {shown.map((e) => (
          <ExerciseCard key={e.id} exercise={e} />
        ))}
      </div>
    </>
  )
}

const GROUPS: [Condition['group'], MessageKey][] = [
  ['joint', 'adaptedJoint'],
  ['health', 'adaptedHealth'],
  ['stage', 'adaptedStage'],
]

/** The adapted section: pick conditions, read the advice, see what helps. */
function Adapted() {
  const { t, l } = useI18n()
  const { state, saveProfile } = useStore()
  const { profile } = state
  // Without a profile the selection lives only on this page.
  const [local, setLocal] = useState<ConditionId[]>([])
  const chosen = profile ? profile.conditions : local
  const active = profile ? effectiveConditions(profile) : local
  const derived = active.filter((c) => conditionById(c).derived)

  const toggle = (id: ConditionId) => {
    const next = chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]
    if (profile) saveProfile({ ...profile, conditions: next })
    else setLocal(next)
  }

  const adapted = exercisesIn('adapted')
  const recommended = active.length ? adapted.filter((e) => e.helps?.some((c) => active.includes(c))) : adapted
  const excluded = EXERCISES.filter((e) => e.avoid.some((c) => active.includes(c))).length

  return (
    <>
      <p>{t('adaptedIntro')}</p>
      {GROUPS.map(([group, title]) => (
        <fieldset key={group} className="chip-field">
          <legend>{t(title)}</legend>
          <div className="chips">
            {SELECTABLE_CONDITIONS.filter((c) => c.group === group).map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={chosen.includes(c.id)} onClick={() => toggle(c.id)}>
                {l(c.name)}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {derived.length > 0 && (
        <p className="muted small">
          {t('adaptedDerived')}: {derived.map((c) => l(conditionById(c).name)).join(', ')}
        </p>
      )}
      {!profile && (
        <p className="note info">
          {t('saveToProfileHint')} <a href={href('profile')}>{t('start')}</a>
        </p>
      )}

      {active.length > 0 && (
        <>
          <p className="note warn">{t('excludedCount', { n: excluded })}</p>
          <div className="advice-grid">
            {CONDITIONS.filter((c) => active.includes(c.id)).map((c) => (
              <section key={c.id} className="card">
                <h2>{l(c.name)}</h2>
                <h3>{t('adviceDo')}</h3>
                <ul>
                  {c.advice[state.lang].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <h3>{t('adviceAvoid')}</h3>
                <p>{l(c.avoid)}</p>
              </section>
            ))}
          </div>
        </>
      )}

      <h2>{t(active.length ? 'recommended' : 'recommendedAll')}</h2>
      <div className="ex-grid">
        {recommended.map((e) => (
          <ExerciseCard key={e.id} exercise={e} />
        ))}
      </div>
      <p className="note muted small">{t('disclaimer')}</p>
    </>
  )
}
