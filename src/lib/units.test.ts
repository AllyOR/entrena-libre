import { describe, expect, it } from 'vitest'
import {
  cmToFeetInches,
  defaultUnits,
  feetInchesToCm,
  formatHeight,
  lengthIn,
  lengthToCm,
  loadIn,
  volumeIn,
  weightIn,
  weightToKg,
} from './units'

describe('weight', () => {
  it('shows kilograms as they are and converts to pounds', () => {
    expect(weightIn(80, 'metric')).toBe(80)
    expect(weightIn(80, 'imperial')).toBe(176.4)
  })

  it('round-trips what a person types in pounds', () => {
    for (const lb of [95, 120.5, 180, 242.3]) {
      expect(weightIn(weightToKg(lb, 'imperial'), 'imperial')).toBe(lb)
    }
    expect(weightToKg(72.5, 'metric')).toBe(72.5)
  })
})

describe('length', () => {
  it('converts centimetres to inches and back', () => {
    expect(lengthIn(86.4, 'imperial')).toBe(34)
    expect(lengthIn(86.4, 'metric')).toBe(86.4)
    for (const inches of [13.5, 30, 34, 41.5]) {
      expect(lengthIn(lengthToCm(inches, 'imperial'), 'imperial')).toBe(inches)
    }
  })

  it('splits a height into feet and whole inches, carrying 12 inches into a foot', () => {
    expect(cmToFeetInches(175.3)).toEqual({ feet: 5, inches: 9 })
    expect(cmToFeetInches(182.6)).toEqual({ feet: 6, inches: 0 })
    expect(cmToFeetInches(152.4)).toEqual({ feet: 5, inches: 0 })
  })

  it('round-trips a height typed in feet and inches', () => {
    for (const [feet, inches] of [[4, 11], [5, 0], [5, 9], [6, 3]]) {
      expect(cmToFeetInches(feetInchesToCm(feet, inches))).toEqual({ feet, inches })
    }
  })

  it('formats a height for text', () => {
    expect(formatHeight(190, 'metric')).toBe('190 cm')
    expect(formatHeight(190.5, 'imperial')).toBe('6 ft 3 in')
  })
})

describe('other quantities', () => {
  it('rounds a training load to what plates allow: 2.5 kg or 5 lb', () => {
    expect(loadIn(32.5, 'metric')).toBe(32.5)
    expect(loadIn(32.5, 'imperial')).toBe(70)
    expect(loadIn(2.5, 'imperial')).toBe(5)
  })

  it('gives water in litres or fluid ounces', () => {
    expect(volumeIn(2.8, 'metric')).toBe(2.8)
    expect(volumeIn(2.8, 'imperial')).toBe(95)
  })
})

describe('defaultUnits', () => {
  it('is imperial only where it is the everyday system', () => {
    expect(defaultUnits('en-US')).toBe('imperial')
    expect(defaultUnits('es-US')).toBe('imperial')
    expect(defaultUnits('es-BO')).toBe('metric')
    expect(defaultUnits('en-GB')).toBe('metric')
    expect(defaultUnits('es')).toBe('metric')
  })
})
