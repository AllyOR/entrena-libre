import { describe, expect, it } from 'vitest'
import { bodyDraft, bodyFromDraft, convertBodyDraft, typedNumber } from './bodyDraft'

const body = { heightCm: 175, weightKg: 80, waistCm: 86.4, neckCm: 38, hipCm: undefined }

describe('typedNumber', () => {
  it('reads decimals with a point or a comma, and nothing from an empty or bad field', () => {
    expect(typedNumber('72.5')).toBe(72.5)
    expect(typedNumber(' 72,5 ')).toBe(72.5)
    expect(typedNumber('')).toBeUndefined()
    expect(typedNumber('abc')).toBeUndefined()
  })
})

describe('bodyDraft', () => {
  it('fills the form in metric', () => {
    expect(bodyDraft(body, 'metric')).toMatchObject({ heightCm: '175', weight: '80', waist: '86.4', neck: '38', hip: '' })
  })

  it('fills the form in imperial', () => {
    expect(bodyDraft(body, 'imperial')).toMatchObject({ heightFt: '5', heightIn: '9', weight: '176.4', waist: '34', neck: '15', hip: '' })
  })

  it('is empty for a new profile', () => {
    expect(bodyDraft({}, 'imperial')).toEqual({ heightCm: '', heightFt: '', heightIn: '', weight: '', waist: '', neck: '', hip: '' })
  })
})

describe('bodyFromDraft', () => {
  it('reads metric fields as they are', () => {
    expect(bodyFromDraft(bodyDraft(body, 'metric'), 'metric')).toEqual(body)
  })

  it('converts imperial fields to metric', () => {
    const typed = { heightCm: '', heightFt: '5', heightIn: '9', weight: '180', waist: '34', neck: '', hip: '' }
    expect(bodyFromDraft(typed, 'imperial')).toEqual({ heightCm: 175.3, weightKg: 81.65, waistCm: 86.4, neckCm: undefined, hipCm: undefined })
  })

  it('keeps the saved value of a field that was not edited, instead of its rounded text', () => {
    const saved = { heightCm: 176, weightKg: 74, waistCm: 84 }
    const shown = bodyDraft(saved, 'imperial')
    expect(bodyFromDraft(shown, 'imperial', saved)).toEqual({ ...saved, neckCm: undefined, hipCm: undefined })
    expect(bodyFromDraft({ ...shown, weight: '170' }, 'imperial', saved)).toMatchObject({ heightCm: 176, weightKg: 77.11, waistCm: 84 })
    expect(bodyFromDraft({ ...shown, heightIn: '10' }, 'imperial', saved)).toMatchObject({ heightCm: 177.8, weightKg: 74 })
  })

  it('takes a height in feet with the inches left empty', () => {
    expect(bodyFromDraft({ ...bodyDraft({}, 'imperial'), heightFt: '6' }, 'imperial').heightCm).toBe(182.9)
  })
})

describe('convertBodyDraft', () => {
  it('keeps what was typed when the person switches units and back', () => {
    const typed = { heightCm: '', heightFt: '5', heightIn: '9', weight: '180', waist: '34', neck: '15', hip: '40' }
    const metric = convertBodyDraft(typed, 'imperial', 'metric')
    expect(metric).toMatchObject({ heightCm: '175.3', weight: '81.65', waist: '86.4' })
    expect(convertBodyDraft(metric, 'metric', 'imperial')).toMatchObject({ heightFt: '5', heightIn: '9', weight: '180', waist: '34', neck: '15', hip: '40' })
  })

  it('shows a saved value exactly again when its field was not edited', () => {
    const saved = { heightCm: 176, weightKg: 74, waistCm: 84 }
    const imperial = bodyDraft(saved, 'imperial')
    expect(convertBodyDraft(imperial, 'imperial', 'metric', saved)).toMatchObject({ heightCm: '176', weight: '74', waist: '84' })
  })

  it('converts only the fields the person edited', () => {
    const saved = { heightCm: 176, weightKg: 74, waistCm: 84 }
    const edited = { ...bodyDraft(saved, 'imperial'), weight: '170' }
    expect(convertBodyDraft(edited, 'imperial', 'metric', saved)).toMatchObject({ heightCm: '176', weight: '77.11', waist: '84' })
  })

  it('leaves empty fields empty', () => {
    expect(convertBodyDraft(bodyDraft({}, 'metric'), 'metric', 'imperial')).toEqual(bodyDraft({}, 'imperial'))
  })
})
