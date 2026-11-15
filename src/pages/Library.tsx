import { useEffect, useRef, useState } from 'react'
import { ExerciseCard } from '../components/ExerciseCard'
import { CONDITIONS, SELECTABLE_CONDITIONS, conditionById, type Condition } from '../data/conditions'
import { EXERCISES, exercisesIn } from '../data/exercises'
import { DISCIPLINE_KEY, MUSCLE_KEY, SECTIONS, SECTION_DESC_KEY, SECTION_KEY } from '../i18n/labels'
import type { MessageKey } from '../i18n/es'
import { useI18n } from '../i18n/useI18n'
import { effectiveConditions } from '../lib/nutrition'
import { href } from '../router'
import { useStore } from '../state/store'
import type { ConditionId, Discipline, Exercise, Muscle, Section } from '../types'

const isSection = (v: string | undefined): v is Section => SECTIONS.includes(v as Section)

export function Library({ section: raw }: { section?: string }) {
  const { t } = useI18n()
  const section: Section = isSection(raw) ? raw : 'gym'
  const tabs = useRef<HTMLElement>(null)

  // On a phone the tabs scroll sideways: keep the current one in view.
  useEffect(() => {
    const strip = tabs.current
    const current = strip?.querySelector<HTMLElement>('[aria-current="page"]')
    if (strip && current) strip.scrollLeft = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2
  }, [section])

  return (
    <>
      <h1>{t('libraryTitle')}</h1>
      <nav className="tabs" ref={tabs} aria-label={t('sections')}>
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
  const [filter, setFilter] = useState('all')
  const all = exercisesIn(section)
  // Martial arts are browsed by art; every other section by muscle group.
  const byArt = section === 'mma'
  const groupOf = (e: Exercise): string => (byArt ? (e.discipline ?? '') : e.muscle)
  const label = (group: string) => t(byArt ? DISCIPLINE_KEY[group as Discipline] : MUSCLE_KEY[group as Muscle])
  const groups = [...new Set(all.map(groupOf))]
  const shown = filter === 'all' ? all : all.filter((e) => groupOf(e) === filter)
  return (
    <>
      {byArt && <p className="note info">{t('mmaNote')}</p>}
      {section === 'stretch' && <p className="note info">{t('stretchNote')}</p>}
      <div className="chips" role="group" aria-label={t('mAll')}>
        {['all', ...groups].map((group) => (
          <button key={group} type="button" className="chip" aria-pressed={group === filter} onClick={() => setFilter(group)}>
            {group === 'all' ? t('mAll') : label(group)}
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
