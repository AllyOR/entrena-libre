import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { SELECTABLE_CONDITIONS } from '../data/conditions'
import type { MessageKey } from '../i18n/es'
import { ACTIVITY_KEY, GOAL_KEY, LEVEL_KEY, SECTION_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { isoDate } from '../lib/dates'
import { LIMITS, parseProfile, parseState } from '../lib/storage'
import { navigate } from '../router'
import { useStore } from '../state/store'
import type { Activity, ConditionId, Goal, Level, Place, Sex } from '../types'

/** The form's fields as typed: numbers stay strings until the profile is saved. */
interface Draft {
  name: string
  sex: Sex
  age: string
  heightCm: string
  weightKg: string
  waistCm: string
  neckCm: string
  hipCm: string
  activity: Activity
  goal: Goal
  level: Level
  place: Place
  daysPerWeek: number
  conditions: ConditionId[]
}

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'athlete']
const GOALS: Goal[] = ['lose', 'maintain', 'gain']
const LEVELS: Level[] = [1, 2, 3]
const PLACES: Place[] = ['gym', 'functional', 'home']
const DAYS = [2, 3, 4, 5, 6]

type NumberField = 'age' | 'heightCm' | 'weightKg' | 'waistCm' | 'neckCm' | 'hipCm'

export function ProfilePage() {
  const { t, l } = useI18n()
  const { state, saveProfile, replaceAll, reset } = useStore()
  const saved = state.profile
  const str = (v: number | undefined) => (v === undefined ? '' : String(v))
  const [draft, setDraft] = useState<Draft>({
    name: saved?.name ?? '',
    sex: saved?.sex ?? 'female',
    age: str(saved?.age),
    heightCm: str(saved?.heightCm),
    weightKg: str(saved?.weightKg),
    waistCm: str(saved?.waistCm),
    neckCm: str(saved?.neckCm),
    hipCm: str(saved?.hipCm),
    activity: saved?.activity ?? 'light',
    goal: saved?.goal ?? 'maintain',
    level: saved?.level ?? 1,
    place: saved?.place ?? 'home',
    daysPerWeek: saved?.daysPerWeek ?? 3,
    conditions: saved?.conditions ?? [],
  })
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setMessage(null)
  }
  const toggleCondition = (id: ConditionId) =>
    set('conditions', draft.conditions.includes(id) ? draft.conditions.filter((c) => c !== id) : [...draft.conditions, id])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))
    const profile = parseProfile({
      ...draft,
      age: num(draft.age),
      heightCm: num(draft.heightCm),
      weightKg: num(draft.weightKg),
      waistCm: num(draft.waistCm),
      neckCm: num(draft.neckCm),
      hipCm: num(draft.hipCm),
    })
    if (!profile) {
      setMessage({ kind: 'error', text: t('invalid') })
      return
    }
    saveProfile(profile)
    setMessage({ kind: 'ok', text: t('saved') })
  }

  const exportData = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `entrena-libre-${isoDate()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const restored = parseState(await file.text(), state)
    if (!restored) {
      setMessage({ kind: 'error', text: t('importBad') })
      return
    }
    replaceAll(restored)
    // The form above still shows the old profile: leave the page.
    navigate()
  }

  const numberInput = (field: NumberField, label: MessageKey, required: boolean, step = '1') => (
    <label>
      <span>
        {t(label)} {!required && <span className="muted small">({t('optional')})</span>}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={LIMITS[field][0]}
        max={LIMITS[field][1]}
        required={required}
        value={draft[field]}
        onChange={(e) => set(field, e.target.value)}
      />
    </label>
  )

  const radios = <T extends string | number>(name: string, options: readonly T[], value: T, label: (o: T) => string, onPick: (o: T) => void) => (
    <div className="segmented">
      {options.map((o) => (
        <label key={o} className={o === value ? 'on' : ''}>
          <input type="radio" name={name} checked={o === value} onChange={() => onPick(o)} />
          {label(o)}
        </label>
      ))}
    </div>
  )

  return (
    <>
      <h1>{t('profileTitle')}</h1>
      <form className="profile-form" onSubmit={submit} noValidate={false}>
        <fieldset className="card">
          <legend>{t('aboutYou')}</legend>
          <div className="form-grid">
            <label>
              <span>
                {t('name')} <span className="muted small">({t('optional')})</span>
              </span>
              <input type="text" maxLength={40} autoComplete="given-name" value={draft.name} onChange={(e) => set('name', e.target.value)} />
            </label>
            <div className="field">
              <span>{t('sex')}</span>
              {radios('sex', ['female', 'male'] as const, draft.sex, (o) => t(o), (o) => set('sex', o))}
            </div>
            {numberInput('age', 'age', true)}
            {numberInput('heightCm', 'heightCm', true)}
            {numberInput('weightKg', 'weightKg', true, '0.1')}
          </div>
          <label>
            <span>{t('activity')}</span>
            <select value={draft.activity} onChange={(e) => set('activity', e.target.value as Activity)}>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {t(ACTIVITY_KEY[a])}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="card">
          <legend>{t('measurementsOpt')}</legend>
          <p className="muted small">{t('measurementsHint')}</p>
          <div className="form-grid">
            {numberInput('waistCm', 'waistCm', false, '0.1')}
            {numberInput('neckCm', 'neckCm', false, '0.1')}
            {numberInput('hipCm', 'hipCm', false, '0.1')}
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>{t('training')}</legend>
          <div className="field">
            <span>{t('goal')}</span>
            {radios('goal', GOALS, draft.goal, (o) => t(GOAL_KEY[o]), (o) => set('goal', o))}
          </div>
          <div className="field">
            <span>{t('level')}</span>
            {radios('level', LEVELS, draft.level, (o) => t(LEVEL_KEY[o]), (o) => set('level', o))}
          </div>
          <div className="field">
            <span>{t('place')}</span>
            {radios('place', PLACES, draft.place, (o) => t(SECTION_KEY[o]), (o) => set('place', o))}
          </div>
          <div className="field">
            <span>{t('daysPerWeek')}</span>
            {radios('days', DAYS, draft.daysPerWeek, String, (o) => set('daysPerWeek', o))}
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>{t('health')}</legend>
          <p className="muted small">{t('healthHint')}</p>
          <div className="chips">
            {SELECTABLE_CONDITIONS.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={draft.conditions.includes(c.id)} onClick={() => toggleCondition(c.id)}>
                {l(c.name)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="row">
          <button type="submit" className="btn primary big">
            {t('saveProfile')}
          </button>
          {message && (
            <span className={`note ${message.kind === 'ok' ? 'ok' : 'danger'}`} role="status">
              {message.text}
            </span>
          )}
        </div>
      </form>

      <section className="card">
        <h2>{t('dataTitle')}</h2>
        <p>{t('dataText')}</p>
        <div className="row">
          <button type="button" className="btn" onClick={exportData}>
            {t('exportData')}
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            {t('importData')}
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importData} />
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (window.confirm(t('resetConfirm'))) {
                reset()
                navigate()
              }
            }}
          >
            {t('resetData')}
          </button>
        </div>
      </section>
      <p className="note muted small">{t('disclaimer')}</p>
    </>
  )
}
