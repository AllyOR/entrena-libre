import { describe, expect, it } from 'vitest'
import { isBusy } from './updates'

describe('isBusy', () => {
  it('is true only inside a workout', () => {
    expect(isBusy('#/workout/2026-11/w1d1')).toBe(true)
    expect(isBusy('')).toBe(false)
    expect(isBusy('#/')).toBe(false)
    expect(isBusy('#/plan')).toBe(false)
    expect(isBusy('#/exercise/gym-pull-up')).toBe(false)
    expect(isBusy('#/workout')).toBe(false)
  })
})
