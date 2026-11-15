import { describe, expect, it } from 'vitest'
import { POSES, solve, JOINTS } from '../figure/poses'
import { POSE_IDS, type ConditionId, type Slot } from '../types'
import { CONDITIONS } from './conditions'
import { EXERCISES, exercisesIn } from './exercises'
import { DISHES } from './meals'

describe('exercise catalogue', () => {
  it('has unique ids with the section prefix', () => {
    const ids = EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^(gym|fun|home|ada|pil|mma)-[a-z0-9-]+$/)
  })

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s is complete in both languages', (_id, e) => {
    expect(POSE_IDS).toContain(e.pose)
    expect(e.name.es).not.toBe('')
    expect(e.name.en).not.toBe('')
    expect(e.equipment.es).not.toBe('')
    expect(e.equipment.en).not.toBe('')
    expect(e.steps.es.length).toBeGreaterThanOrEqual(3)
    expect(e.steps.es.length).toBeLessThanOrEqual(4)
    expect(e.steps.en).toHaveLength(e.steps.es.length)
    expect(e.mistakes.es).toHaveLength(2)
    expect(e.mistakes.en).toHaveLength(2)
    for (const text of [...e.steps.es, ...e.steps.en]) expect(text.length).toBeLessThanOrEqual(120)
    expect(e.breathing.es).not.toBe('')
    expect(e.breathing.en).not.toBe('')
    expect(e.avoid.filter((c) => e.caution.includes(c))).toEqual([])
  })

  it('marks every jumping exercise as contraindicated for joints and weight', () => {
    for (const e of EXERCISES.filter((x) => x.impact === 'high')) {
      for (const c of ['knee', 'obesity', 'pregnancy'] as ConditionId[]) {
        expect(e.avoid, `${e.id} should avoid ${c}`).toContain(c)
      }
    }
  })

  it('gives each section enough exercises per movement pattern', () => {
    const count = (section: 'gym' | 'functional' | 'home', slot: Slot) =>
      exercisesIn(section).filter((e) => e.slot === slot).length
    for (const section of ['gym', 'functional', 'home'] as const) {
      expect(exercisesIn(section).length).toBeGreaterThanOrEqual(20)
      for (const slot of ['squat', 'hinge', 'lunge', 'push', 'pull', 'overhead', 'core'] as Slot[]) {
        expect(count(section, slot), `${section}/${slot}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('names the martial art of every martial-arts drill, and of nothing else', () => {
    for (const e of EXERCISES) {
      expect(Boolean(e.discipline), e.id).toBe(e.sections.includes('mma'))
    }
    for (const art of ['kickboxing', 'jiujitsu', 'taekwondo', 'karate'] as const) {
      expect(exercisesIn('mma').filter((e) => e.discipline === art).length, art).toBeGreaterThanOrEqual(4)
    }
    expect(exercisesIn('pilates').length).toBeGreaterThanOrEqual(15)
  })

  it('has an adapted exercise that helps each condition', () => {
    const adapted = exercisesIn('adapted')
    for (const c of CONDITIONS) {
      expect(adapted.some((e) => e.helps?.includes(c.id)), c.id).toBe(true)
    }
  })
})

describe('poses', () => {
  it.each(POSE_IDS.map((id) => [id] as const))('%s solves to finite joints inside the canvas', (id) => {
    for (const frame of [POSES[id].a, POSES[id].b]) {
      const skeleton = solve(frame)
      for (const joint of JOINTS) {
        const [x, y] = skeleton[joint]
        expect(Number.isFinite(x) && Number.isFinite(y), `${id}.${joint}`).toBe(true)
        expect(x, `${id}.${joint} x`).toBeGreaterThanOrEqual(0)
        expect(x, `${id}.${joint} x`).toBeLessThanOrEqual(120)
        expect(y, `${id}.${joint} y`).toBeGreaterThanOrEqual(-10)
        expect(y, `${id}.${joint} y`).toBeLessThanOrEqual(98)
      }
    }
  })
})

describe('dishes', () => {
  it('state calories consistent with their macros', () => {
    for (const d of DISHES) {
      const fromMacros = d.protein * 4 + d.carbs * 4 + d.fat * 9
      expect(Math.abs(fromMacros - d.kcal), d.id).toBeLessThanOrEqual(d.kcal * 0.06)
    }
  })

  it('offer a low-glycaemic and low-sodium option for every meal', () => {
    for (const type of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const both = DISHES.filter((d) => d.type === type && d.tags.includes('lowGi') && d.tags.includes('lowSodium'))
      expect(both.length, type).toBeGreaterThanOrEqual(2)
    }
  })
})
