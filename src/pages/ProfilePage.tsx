import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { Paywall } from '../components/Paywall'
import { RemindersCard } from '../components/RemindersCard'
import { SELECTABLE_CONDITIONS } from '../data/conditions'
import { ACTIVITY_KEY, GOAL_KEY, LEVEL_KEY, SECTION_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { bodyDraft, bodyFromDraft, convertBodyDraft, equivalents, typedNumber, type BodyDraft } from '../lib/bodyDraft'
import { isoDate } from '../lib/dates'
import { lockedPlace } from '../lib/premium'
import { LIMITS, parseProfile, parseState } from '../lib/storage'
import { LENGTH_UNIT, WEIGHT_UNIT, lengthIn, weightIn, type Units } from '../lib/units'
import { href, navigate } from '../router'
import { usePremium } from '../state/premium'
import { useStore } from '../state/store'
import type { Activity, ConditionId, Goal, Level, Place, Sex } from '../types'

/** The form's fields as typed: numbers stay strings, in the person's units, until the profile is saved. */
interface Draft extends BodyDraft {
  name: string
  sex: Sex
  age: string
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
const PLACES: Place[] = ['gym', 'functional', 'home', 'pilates', 'mma']
const DAYS = [2, 3, 4, 5, 6]

type NumberField = 'age' | keyof BodyDraft

const UNIT_OPTIONS: Units[] = ['metric', 'imperial']

export function ProfilePage() {
  const { t, l, n } = useI18n()
  const { state, saveProfile, setUnits, replaceAll, reset } = useStore()
  const { units } = state
  const saved = state.profile
  const premium = usePremium()
  const [draft, setDraft] = useState<Draft>({
    name: saved?.name ?? '',
    sex: saved?.sex ?? 'female',
    age: saved ? String(saved.age) : '',
    ...bodyDraft(saved ?? {}, units),
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
  // Switching units re-expresses what is already typed, so nothing has to be entered again.
  const changeUnits = (next: Units) => {
    setDraft((d) => ({ ...d, ...convertBodyDraft(d, units, next, saved ?? {}) }))
    setUnits(next)
    setMessage(null)
  }
  const toggleCondition = (id: ConditionId) =>
    set('conditions', draft.conditions.includes(id) ? draft.conditions.filter((c) => c !== id) : [...draft.conditions, id])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const profile = parseProfile({ ...draft, age: typedNumber(draft.age), ...bodyFromDraft(draft, units, saved ?? {}) })
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
    link.download = `training-seasonny-${isoDate()}.json`
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

  const weightUnit = WEIGHT_UNIT[units]
  const lengthUnit = LENGTH_UNIT[units]
  /** The allowed range of a stored length or weight, in the units on screen. */
  const lengthRange = (key: 'waistCm' | 'neckCm' | 'hipCm') => LIMITS[key].map((cm) => lengthIn(cm, units)) as [number, number]
  const weightRange = LIMITS.weightKg.map((kg) => weightIn(kg, units)) as [number, number]

  /** Each measurement in the other unit system, shown under its field as it is typed. */
  const also = equivalents(draft, units, n, saved ?? {})

  const numberInput = (
    field: NumberField,
    label: string,
    [min, max]: readonly [number, number],
    required: boolean,
    step = '1',
    equivalent = '',
  ) => (
    <label>
      <span>
        {label} {!required && <span className="muted small">({t('optional')})</span>}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        required={required}
        value={draft[field]}
        onChange={(e) => set(field, e.target.value)}
      />
      {equivalent && <span className="equivalent">≈ {equivalent}</span>}
    </label>
  )

  const radios = <T extends string | number>(name: string, options: readonly T[], value: T, label: (o: T) => ReactNode, onPick: (o: T) => void) => (
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
            {numberInput('age', t('age'), LIMITS.age, true)}
            <div className="field">
              <span>{t('units')}</span>
              {radios('units', UNIT_OPTIONS, units, (o) => t(o === 'metric' ? 'unitsMetric' : 'unitsImperial'), changeUnits)}
            </div>
            {units === 'metric' ? (
              numberInput('heightCm', t('heightCm', { unit: 'cm' }), LIMITS.heightCm, true, '0.1', also.height)
            ) : (
              <>
                {numberInput('heightFt', t('heightFeet'), [3, 7], true)}
                {numberInput('heightIn', t('heightInches'), [0, 11], false, '1', also.height)}
              </>
            )}
            {numberInput('weight', t('weightKg', { unit: weightUnit }), weightRange, true, '0.1', also.weight)}
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
            {numberInput('waist', t('waistCm', { unit: lengthUnit }), lengthRange('waistCm'), false, '0.1', also.waist)}
            {numberInput('neck', t('neckCm', { unit: lengthUnit }), lengthRange('neckCm'), false, '0.1', also.neck)}
            {numberInput('hip', t('hipCm', { unit: lengthUnit }), lengthRange('hipCm'), false, '0.1', also.hip)}
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
            {radios(
              'place',
              PLACES,
              draft.place,
              (o) => (
                <>
                  {t(SECTION_KEY[o])}
                  {lockedPlace(o, premium) && (
                    <span className="lock" title={t('premiumLocked')}>
                      <Icon name="lock" size={13} />
                    </span>
                  )}
                </>
              ),
              // A premium training type opens the offer instead of being chosen.
              (o) => (lockedPlace(o, premium) ? navigate('premium') : set('place', o)),
            )}
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

      {premium.enabled && <Paywall compact />}

      <RemindersCard />

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
      <p className="note muted small">
        {t('disclaimer')} <a href={href('privacy')}>{t('privacyLink')}</a>
      </p>
    </>
  )
}
