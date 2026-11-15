/**
 * Measurement units. The app stores metric (kg, cm, litres) and converts only at the
 * edges: what a person types and what they read.
 */
export type Units = 'metric' | 'imperial'

const LB_PER_KG = 2.2046226218
const CM_PER_IN = 2.54
const FL_OZ_PER_L = 33.814

const round = (value: number, decimals: number) => {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export const WEIGHT_UNIT: Record<Units, string> = { metric: 'kg', imperial: 'lb' }
export const LENGTH_UNIT: Record<Units, string> = { metric: 'cm', imperial: 'in' }
export const VOLUME_UNIT: Record<Units, string> = { metric: 'L', imperial: 'fl oz' }

/**
 * A stored weight in the person's unit: pounds to one decimal, kilograms as stored
 * (two decimals at most), so switching units and back never changes the value.
 */
export const weightIn = (kg: number, units: Units): number => (units === 'imperial' ? round(kg * LB_PER_KG, 1) : round(kg, 2))

/** A typed weight to kilograms. Two decimals, so pounds survive the round trip. */
export const weightToKg = (value: number, units: Units): number => round(units === 'imperial' ? value / LB_PER_KG : value, 2)

/** A stored length (waist, neck, hip) in the person's unit, to one decimal. */
export const lengthIn = (cm: number, units: Units): number => round(units === 'imperial' ? cm / CM_PER_IN : cm, 1)

export const lengthToCm = (value: number, units: Units): number => round(units === 'imperial' ? value * CM_PER_IN : value, 1)

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round(cm / CM_PER_IN)
  return { feet: Math.floor(total / 12), inches: total % 12 }
}

export const feetInchesToCm = (feet: number, inches: number): number => round((feet * 12 + inches) * CM_PER_IN, 1)

/** "190 cm" or "6 ft 3 in". */
export function formatHeight(cm: number, units: Units): string {
  if (units === 'metric') return `${round(cm, 0)} cm`
  const { feet, inches } = cmToFeetInches(cm)
  return `${feet} ft ${inches} in`
}

/** A training load in the steps plates come in: the kilograms as given, or the nearest 5 lb. */
export const loadIn = (kg: number, units: Units): number =>
  units === 'imperial' ? Math.max(Math.round((kg * LB_PER_KG) / 5) * 5, 5) : kg

/** Litres as they are, or whole fluid ounces. */
export const volumeIn = (liters: number, units: Units): number => (units === 'imperial' ? Math.round(liters * FL_OZ_PER_L) : liters)

/** Imperial where it is the everyday system (United States, Liberia, Myanmar), metric elsewhere. */
export function defaultUnits(locale: string): Units {
  return /[-_](US|LR|MM)\b/i.test(locale) ? 'imperial' : 'metric'
}
