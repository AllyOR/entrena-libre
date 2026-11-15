import { useState } from 'react'
import { Paywall } from '../components/Paywall'
import { conditionById } from '../data/conditions'
import { BMI_KEY, GOAL_KEY, GOAL_NOTE_KEY, MEAL_KEY, TAG_KEY } from '../i18n/labels'
import { useI18n } from '../i18n/useI18n'
import { dayOfYear } from '../lib/dates'
import {
  bmi,
  bmiCategory,
  bmr,
  bodyFatPct,
  calorieTarget,
  healthyWeightRange,
  macros,
  suggestMenu,
  tdee,
  waistToHeight,
  waterLiters,
} from '../lib/nutrition'
import { VOLUME_UNIT, WEIGHT_UNIT, formatWeight, otherUnits, volumeIn, weightIn } from '../lib/units'
import { href } from '../router'
import { usePremium } from '../state/premium'
import { useStore } from '../state/store'
import { NeedProfile } from './PlanPage'

const BMI_MIN = 15
const BMI_MAX = 40
/** Zone boundaries of the BMI scale, as a share of its width. */
const zone = (from: number, to: number) => `${((to - from) / (BMI_MAX - BMI_MIN)) * 100}%`

function BmiScale({ value, format }: { value: number; format: (v: number) => string }) {
  const position = ((Math.min(Math.max(value, BMI_MIN), BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100
  return (
    <div className="bmi-scale" aria-hidden="true">
      <div className="bmi-zones">
        <span className="z-under" style={{ width: zone(BMI_MIN, 18.5) }} />
        <span className="z-normal" style={{ width: zone(18.5, 25) }} />
        <span className="z-over" style={{ width: zone(25, 30) }} />
        <span className="z-obese" style={{ width: zone(30, BMI_MAX) }} />
      </div>
      <span className="bmi-marker" style={{ left: `${position}%` }} />
      <div className="bmi-ticks">
        {[18.5, 25, 30].map((tick) => (
          <span key={tick} style={{ left: `${((tick - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100}%` }}>
            {format(tick)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Nutrition() {
  const { t, l, n } = useI18n()
  const { profile, units } = useStore().state
  const premium = usePremium()
  const [offset, setOffset] = useState(0)

  if (!profile) {
    return (
      <>
        <h1>{t('nutritionTitle')}</h1>
        <NeedProfile />
      </>
    )
  }

  const bodyMass = bmi(profile.weightKg, profile.heightCm)
  const [minKg, maxKg] = healthyWeightRange(profile.heightCm)
  const target = calorieTarget(profile)
  const expenditure = tdee(profile)
  const split = macros(profile)
  const fatPct = bodyFatPct(profile)
  const ratio = waistToHeight(profile)
  const pregnant = profile.conditions.includes('pregnancy')
  const floored = !pregnant && profile.goal === 'lose' && target > Math.round((expenditure * 0.8) / 10) * 10

  const dietConditions = profile.conditions.filter((c) => c === 'diabetes' || c === 'hypertension')
  const menu = suggestMenu(target, dietConditions, dayOfYear() + offset)
  const menuKcal = menu.reduce((sum, m) => sum + m.kcal, 0)

  const macroRows = [
    { key: 'protein' as const, grams: split.protein, kcal: split.protein * 4 },
    { key: 'carbs' as const, grams: split.carbs, kcal: split.carbs * 4 },
    { key: 'fat' as const, grams: split.fat, kcal: split.fat * 9 },
  ]

  return (
    <>
      <h1>{t('nutritionTitle')}</h1>
      <div className="metric-grid">
        <section className="card">
          <h2>{t('bmiTitle')}</h2>
          <p>
            <span className="big-number">{n(bodyMass)}</span> <strong>{t(BMI_KEY[bmiCategory(bodyMass)])}</strong>
          </p>
          <BmiScale value={bodyMass} format={n} />
          <p>
            {t('healthyRange', { min: n(weightIn(minKg, units)), max: n(weightIn(maxKg, units)), unit: WEIGHT_UNIT[units] })}{' '}
            <span className="equivalent">
              ≈ {n(weightIn(minKg, otherUnits(units)))}–{formatWeight(maxKg, otherUnits(units), n)}
            </span>
          </p>
          <p className="muted small">{t('bmiNote')}</p>
        </section>

        <section className="card">
          <h2>{t('energyTitle')}</h2>
          <dl className="facts">
            <div>
              <dt>{t('bmrLabel')}</dt>
              <dd>
                {n(bmr(profile))} {t('kcal')}
              </dd>
            </div>
            <div>
              <dt>{t('tdeeLabel')}</dt>
              <dd>
                {n(expenditure)} {t('kcal')}
              </dd>
            </div>
            <div className="highlight">
              <dt>
                {t('targetLabel')}: {t(GOAL_KEY[profile.goal])}
              </dt>
              <dd>
                {n(target)} {t('kcal')}
              </dd>
            </div>
          </dl>
          <p className="muted small">{pregnant ? t('pregnancyNote') : t(GOAL_NOTE_KEY[profile.goal])}</p>
          {floored && <p className="note warn small">{t('floorNote')}</p>}
        </section>

        <section className="card">
          <h2>{t('macrosTitle')}</h2>
          {macroRows.map((row) => (
            <div key={row.key} className="macro">
              <span className="macro-label">
                <span>{t(row.key)}</span>
                <strong>{t('grams', { n: row.grams })}</strong>
              </span>
              <span className="macro-bar">
                <span className={`m-${row.key}`} style={{ width: `${Math.min((row.kcal / target) * 100, 100)}%` }} />
              </span>
            </div>
          ))}
          <p>
            <strong>{t('water')}:</strong> {t('waterValue', { n: n(volumeIn(waterLiters(profile.weightKg), units)), unit: VOLUME_UNIT[units] })}
          </p>
        </section>

        <section className="card">
          <h2>{t('bodyFat')}</h2>
          {fatPct === null ? (
            <p className="muted">
              {t('bodyFatMissing')} <a href={href('profile')}>{t('navProfile')}</a>
            </p>
          ) : (
            <p>
              <span className="big-number">{n(fatPct)} %</span>
            </p>
          )}
          {ratio !== null && (
            <>
              <h3>{t('waistHeight')}</h3>
              <p>
                <strong>{n(ratio)}</strong> · {t(ratio < 0.5 ? 'waistOk' : 'waistHigh')}
              </p>
            </>
          )}
        </section>
      </div>

      {premium.unlocked ? (
        <>
          <div className="section-head">
            <h2>{t('menuTitle')}</h2>
            <button type="button" className="btn" onClick={() => setOffset(offset + 1)}>
              {t('menuOther')}
            </button>
          </div>
          {dietConditions.length > 0 && (
            <p className="note info small">{t('menuFiltered', { list: dietConditions.map((c) => l(conditionById(c).name)).join(', ') })}</p>
          )}
          <div className="menu-grid">
            {menu.map(({ dish, portion, kcal }) => (
              <section key={dish.id} className="card dish">
                <p className="muted small">{t(MEAL_KEY[dish.type])}</p>
                <h3>{l(dish.name)}</h3>
                <p className="small">{l(dish.detail)}</p>
                <p className="dish-facts">
                  <strong>
                    {n(kcal)} {t('kcal')}
                  </strong>
                  <span className="muted small">{t('portion', { n: n(portion) })}</span>
                </p>
                <p className="muted small">
                  {t('protein')} {t('grams', { n: Math.round(dish.protein * portion) })} · {t('carbs')}{' '}
                  {t('grams', { n: Math.round(dish.carbs * portion) })} · {t('fat')} {t('grams', { n: Math.round(dish.fat * portion) })}
                </p>
                {dish.tags.length > 0 && (
                  <p className="tags">
                    {dish.tags.map((tag) => (
                      <span key={tag} className="tag small">
                        {t(TAG_KEY[tag])}
                      </span>
                    ))}
                  </p>
                )}
              </section>
            ))}
          </div>
          <p>
            <strong>{t('menuTotal', { n: n(menuKcal), target: n(target) })}</strong>
          </p>
        </>
      ) : (
        <>
          <h2>{t('menuTitle')}</h2>
          <Paywall compact />
        </>
      )}
      <p className="note muted small">
        {t('formulaNote')} {t('disclaimer')}
      </p>
    </>
  )
}
