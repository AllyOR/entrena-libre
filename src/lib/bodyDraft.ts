/**
 * The body measurements of the profile form, as the person types them: strings, in
 * their units. Converting them is kept out of the form so it can be tested.
 */
import {
  cmToFeetInches,
  feetInchesToCm,
  formatHeight,
  formatLength,
  formatWeight,
  lengthIn,
  lengthToCm,
  otherUnits,
  toKg,
  weightIn,
  weightToKg,
  type Units,
} from './units'

export interface BodyDraft {
  /** Height in centimetres: used with metric units. */
  heightCm: string
  /** Height in feet and inches: used with imperial units. */
  heightFt: string
  heightIn: string
  weight: string
  waist: string
  neck: string
  hip: string
}

export interface BodyMetric {
  heightCm?: number
  weightKg?: number
  waistCm?: number
  neckCm?: number
  hipCm?: number
}

const text = (value: number | undefined): string => (value === undefined ? '' : String(value))

/** What a field holds: undefined when empty or not a number. Accepts a decimal comma. */
export const typedNumber = (value: string): number | undefined => {
  const trimmed = value.trim().replace(',', '.')
  if (trimmed === '') return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

const each = <T>(value: T | undefined, convert: (v: T) => number): number | undefined =>
  value === undefined ? undefined : convert(value)

/** The form fields for stored metric measurements. */
export function bodyDraft(body: BodyMetric, units: Units): BodyDraft {
  const height = body.heightCm === undefined ? undefined : cmToFeetInches(body.heightCm)
  return {
    heightCm: text(body.heightCm),
    heightFt: text(height?.feet),
    heightIn: text(height?.inches),
    weight: text(each(body.weightKg, (kg) => weightIn(kg, units))),
    waist: text(each(body.waistCm, (cm) => lengthIn(cm, units))),
    neck: text(each(body.neckCm, (cm) => lengthIn(cm, units))),
    hip: text(each(body.hipCm, (cm) => lengthIn(cm, units))),
  }
}

/** Whether the height fields still show the saved height. */
const heightUntouched = (draft: BodyDraft, shown: BodyDraft, units: Units): boolean =>
  units === 'metric'
    ? draft.heightCm === shown.heightCm && shown.heightCm !== ''
    : draft.heightFt === shown.heightFt && draft.heightIn === shown.heightIn && shown.heightFt !== ''

/**
 * The metric measurements for what was typed. A height in feet may leave the inches empty.
 *
 * A field still showing its saved value keeps that value exactly: the text on screen is
 * rounded (176 cm reads "5 ft 9 in", which is 175.3 cm), and saving the form must not
 * change what the person did not touch.
 */
export function bodyFromDraft(draft: BodyDraft, units: Units, saved: BodyMetric = {}): BodyMetric {
  const shown = bodyDraft(saved, units)
  const kept = <K extends keyof BodyMetric>(field: keyof BodyDraft, key: K, convert: (v: number) => number): number | undefined =>
    draft[field] === shown[field] && shown[field] !== '' ? saved[key] : each(typedNumber(draft[field]), convert)

  const typedHeight =
    units === 'metric'
      ? typedNumber(draft.heightCm)
      : each(typedNumber(draft.heightFt), (ft) => feetInchesToCm(ft, typedNumber(draft.heightIn) ?? 0))
  return {
    heightCm: heightUntouched(draft, shown, units) ? saved.heightCm : typedHeight,
    weightKg: kept('weight', 'weightKg', (v) => weightToKg(v, units)),
    waistCm: kept('waist', 'waistCm', (v) => lengthToCm(v, units)),
    neckCm: kept('neck', 'neckCm', (v) => lengthToCm(v, units)),
    hipCm: kept('hip', 'hipCm', (v) => lengthToCm(v, units)),
  }
}

/**
 * The same measurements re-expressed when the person switches units mid-form: fields
 * they edited are converted from what they typed, the rest come from the saved values.
 */
export function convertBodyDraft(draft: BodyDraft, from: Units, to: Units, saved: BodyMetric = {}): BodyDraft {
  if (from === to) return draft
  return bodyDraft(bodyFromDraft(draft, from, saved), to)
}

export type BodyField = 'height' | 'weight' | 'waist' | 'neck' | 'hip'

/**
 * What is typed in each field, written in the other unit system: "74" kg reads
 * "163.1 lb". Both systems are always on screen, whichever one the person types in.
 * Empty for a field that is empty or not a number.
 */
export function equivalents(
  draft: BodyDraft,
  units: Units,
  format: (n: number) => string,
  saved: BodyMetric = {},
): Record<BodyField, string> {
  // As when saving: an unedited field stands for its saved value, not for its rounded text.
  const body = bodyFromDraft(draft, units, saved)
  const other = otherUnits(units)
  const length = (cm: number | undefined) => (cm === undefined ? '' : formatLength(cm, other, format))
  const typedWeight = typedNumber(draft.weight)
  const unedited = draft.weight !== '' && draft.weight === bodyDraft(saved, units).weight
  const weightKg = unedited ? saved.weightKg : typedWeight === undefined ? undefined : toKg(typedWeight, units)
  return {
    height: body.heightCm === undefined ? '' : formatHeight(body.heightCm, other, format),
    weight: weightKg === undefined ? '' : formatWeight(weightKg, other, format),
    waist: length(body.waistCm),
    neck: length(body.neckCm),
    hip: length(body.hipCm),
  }
}
