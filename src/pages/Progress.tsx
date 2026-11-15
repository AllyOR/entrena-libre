import { useState, type FormEvent } from 'react'
import { BarChart, LineChart, Ring } from '../components/charts'
import { useI18n } from '../i18n/useI18n'
import { formatDate, formatMonth, isoDate, monthKey } from '../lib/dates'
import { monthStats, weekStreak } from '../lib/stats'
import { typedNumber } from '../lib/bodyDraft'
import { LIMITS } from '../lib/storage'
import {
  LENGTH_UNIT,
  WEIGHT_UNIT,
  formatLength,
  formatWeight,
  lengthIn,
  lengthToCm,
  otherUnits,
  toKg,
  weightIn,
  weightToKg,
} from '../lib/units'
import { useStore } from '../state/store'
import { NeedProfile } from './PlanPage'

export function Progress() {
  const { t, lang, n } = useI18n()
  const { state, addMeasurement, removeMeasurement } = useStore()
  const { profile, plans, measurements, units } = state
  const weightUnit = WEIGHT_UNIT[units]
  const lengthUnit = LENGTH_UNIT[units]
  const [date, setDate] = useState(isoDate())
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  // What is being typed, in the other unit system.
  const other = otherUnits(units)
  const typedWeightNow = typedNumber(weight)
  const typedWaistNow = typedNumber(waist)
  const weightAlso = typedWeightNow === undefined ? '' : formatWeight(toKg(typedWeightNow, units), other, n)
  const waistAlso = typedWaistNow === undefined ? '' : formatLength(lengthToCm(typedWaistNow, units), other, n)

  if (!profile) {
    return (
      <>
        <h1>{t('progressTitle')}</h1>
        <NeedProfile />
      </>
    )
  }

  const stats = monthStats(plans)
  const month = monthKey()
  const current = stats.find((s) => s.month === month)
  const first = measurements[0]
  const last = measurements[measurements.length - 1]

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const typedWeight = typedNumber(weight)
    const typedWaist = typedNumber(waist)
    if (!typedWeight) return
    addMeasurement({
      date,
      weightKg: weightToKg(typedWeight, units),
      waistCm: typedWaist === undefined ? undefined : lengthToCm(typedWaist, units),
    })
    setWeight('')
    setWaist('')
  }

  return (
    <>
      <h1>{t('progressTitle')}</h1>

      <h2>{formatMonth(month, lang, 'title')}</h2>
      <div className="stat-row">
        <div className="card stat">
          <Ring value={current?.total ? current.done / current.total : 0} label={t('completion', { n: current?.total ? Math.round((current.done / current.total) * 100) : 0 })} />
        </div>
        <div className="card stat">
          <span className="big-number">
            {current?.done ?? 0}
            <span className="muted">/{current?.total ?? 0}</span>
          </span>
          <span className="muted">{t('sessionsDone')}</span>
        </div>
        <div className="card stat">
          <span className="big-number">{current?.minutes ?? 0}</span>
          <span className="muted">{t('minutesTrained')}</span>
        </div>
        <div className="card stat">
          <span className="big-number">{weekStreak(plans, isoDate())}</span>
          <span className="muted">{t('streak')}</span>
        </div>
      </div>

      <div className="chart-grid">
        <section className="card">
          <h2>{t('byMonth')}</h2>
          {stats.length === 0 ? (
            <p className="muted">{t('noHistory')}</p>
          ) : (
            <BarChart
              label={t('byMonth')}
              bars={stats.slice(-6).map((s) => ({ label: formatMonth(s.month, lang, 'short'), value: s.done, caption: `${s.done}/${s.total}` }))}
            />
          )}
        </section>

        <section className="card">
          <h2>{t('weightTitle')}</h2>
          {measurements.length === 0 ? (
            <p className="muted">{t('noMeasurements')}</p>
          ) : (
            <>
              <LineChart
                label={t('weightTitle')}
                unit={weightUnit}
                points={measurements.map((m) => ({ label: formatDate(m.date, lang), value: weightIn(m.weightKg, units) }))}
              />
              {measurements.length > 1 && (
                <p className="muted small">
                  {t('change', {
                    n: `${last.weightKg >= first.weightKg ? '+' : '−'}${n(Math.abs(Math.round((weightIn(last.weightKg, units) - weightIn(first.weightKg, units)) * 10) / 10))}`,
                    unit: weightUnit,
                    date: formatDate(first.date, lang),
                  })}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <section className="card">
        <h2>{t('addMeasurement')}</h2>
        <form className="inline-form" onSubmit={submit}>
          <label>
            {t('date')}
            <input type="date" value={date} max={isoDate()} required onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            {t('weightKg', { unit: weightUnit })}
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={weightIn(LIMITS.weightKg[0], units)}
              max={weightIn(LIMITS.weightKg[1], units)}
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            {weightAlso && <span className="equivalent">≈ {weightAlso}</span>}
          </label>
          <label>
            {t('waistCm', { unit: lengthUnit })} <span className="muted small">({t('optional')})</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={lengthIn(LIMITS.waistCm[0], units)}
              max={lengthIn(LIMITS.waistCm[1], units)}
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
            />
            {waistAlso && <span className="equivalent">≈ {waistAlso}</span>}
          </label>
          <button type="submit" className="btn primary">
            {t('save')}
          </button>
        </form>

        {measurements.length > 0 && (
          <>
            <h3>{t('history')}</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('weightKg', { unit: weightUnit })}</th>
                    <th>{t('waistCm', { unit: lengthUnit })}</th>
                    <th>
                      <span className="sr-only">{t('delete')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((m) => (
                    <tr key={m.date}>
                      <td>{formatDate(m.date, lang)}</td>
                      <td>
                        {n(weightIn(m.weightKg, units))} <span className="equivalent">≈ {formatWeight(m.weightKg, other, n)}</span>
                      </td>
                      <td>{m.waistCm ? n(lengthIn(m.waistCm, units)) : '—'}</td>
                      <td>
                        <button type="button" className="btn small" onClick={() => removeMeasurement(m.date)}>
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
