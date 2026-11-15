import { describe, expect, it } from 'vitest'
import { EXERCISES, exerciseById } from '../data/exercises'
import { PREMIUM_SECTIONS, isPremiumExercise, isPremiumPlace, isPremiumSection, lockedPlace } from './premium'

describe('what is premium', () => {
  it('is the Pilates and martial-arts sections; the rest of the library is free', () => {
    expect(PREMIUM_SECTIONS).toEqual(['pilates', 'mma'])
    for (const section of ['gym', 'functional', 'home', 'stretch', 'adapted'] as const) {
      expect(isPremiumSection(section), section).toBe(false)
    }
  })

  it('locks an exercise only when every section that lists it is premium', () => {
    expect(isPremiumExercise(exerciseById('pil-hundred')!)).toBe(true)
    expect(isPremiumExercise(exerciseById('mma-kb-jab-cross')!)).toBe(true)
    expect(isPremiumExercise(exerciseById('gym-pull-up')!)).toBe(false)
    expect(isPremiumExercise({ ...exerciseById('pil-hundred')!, sections: ['pilates', 'home'] })).toBe(false)
  })

  it('never locks the adapted or stretching exercises: safety advice stays free', () => {
    for (const e of EXERCISES.filter((x) => x.sections.includes('adapted') || x.sections.includes('stretch'))) {
      expect(isPremiumExercise(e), e.id).toBe(false)
    }
  })

  it('treats Pilates and martial arts as premium training types', () => {
    expect(isPremiumPlace('pilates')).toBe(true)
    expect(isPremiumPlace('mma')).toBe(true)
    expect(isPremiumPlace('home')).toBe(false)
  })
})

describe('lockedPlace', () => {
  it('is false for everyone when the paywall is off or premium is owned', () => {
    expect(lockedPlace('mma', { enabled: false, entitled: false })).toBe(false)
    expect(lockedPlace('mma', { enabled: true, entitled: true })).toBe(false)
  })

  it('is true only for a premium training type without premium', () => {
    expect(lockedPlace('mma', { enabled: true, entitled: false })).toBe(true)
    expect(lockedPlace('gym', { enabled: true, entitled: false })).toBe(false)
  })
})
