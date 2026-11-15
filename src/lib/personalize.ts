/**
 * Adapts an exercise to the person: whether it suits their conditions, what to do
 * instead, how to modify it, and a starting load. Pure functions.
 */
import { conditionById } from '../data/conditions'
import { EXERCISES } from '../data/exercises'
import type { ConditionId, Exercise, L10n, PoseId, Profile, Slot } from '../types'
import { bmi, effectiveConditions, healthyWeightRange } from './nutrition'

export type Status = 'ok' | 'caution' | 'avoid'

export interface Tip {
  id: string
  kind: 'avoid' | 'caution' | 'info'
  text: L10n
}

const matching = (list: readonly ConditionId[], p: Profile) => {
  const mine = effectiveConditions(p)
  return list.filter((c) => mine.includes(c))
}

export function statusFor(e: Exercise, p: Profile): Status {
  if (matching(e.avoid, p).length) return 'avoid'
  if (matching(e.caution, p).length) return 'caution'
  return 'ok'
}

/** The pattern to fall back on when nothing safe exists in the exercise's own. */
export const SUBSTITUTE_SLOT: Partial<Record<Slot, Slot>> = { overhead: 'push', arms: 'pull' }

/** A safe exercise to do instead: same movement pattern, low impact first, closest in setting. */
export function alternativeFor(e: Exercise, p: Profile): Exercise | undefined {
  const pick = (slot: Slot) =>
    EXERCISES.filter((x) => x.id !== e.id && x.slot === slot && x.level <= Math.max(p.level, e.level) && statusFor(x, p) !== 'avoid')
      .map((x) => ({
        x,
        score:
          (x.sections.some((s) => e.sections.includes(s)) ? 0 : x.sections.includes(p.place) ? 1 : 2) +
          (statusFor(x, p) === 'caution' ? 3 : 0) +
          (x.impact === 'high' ? 3 : 0),
      }))
      .sort((a, b) => a.score - b.score || a.x.level - b.x.level)[0]?.x
  const substitute = SUBSTITUTE_SLOT[e.slot]
  return pick(e.slot) ?? (substitute ? pick(substitute) : undefined)
}

const WEIGHT_FRACTION: Record<Slot, [number, number, number] | null> = {
  squat: [0.4, 0.75, 1.1],
  hinge: [0.5, 0.9, 1.3],
  lunge: [0.2, 0.4, 0.6],
  push: [0.35, 0.6, 0.9],
  pull: [0.3, 0.5, 0.75],
  overhead: [0.2, 0.35, 0.5],
  arms: [0.15, 0.25, 0.35],
  core: [0.1, 0.15, 0.2],
  cardio: null,
  mobility: null,
}

/**
 * A conservative first working load in kg for a gym exercise: the bar's total for a
 * barbell, each hand for dumbbells. Null when the exercise uses no gym weight.
 */
export function startingLoadKg(e: Exercise, p: Profile): number | null {
  const fraction = WEIGHT_FRACTION[e.slot]
  if (!fraction || !e.sections.includes('gym')) return null
  if (e.gear !== 'barbell' && e.gear !== 'dumbbell' && e.gear !== 'kettlebell') return null

  // Above the healthy range, extra body weight is not extra strength.
  const reference = Math.min(p.weightKg, healthyWeightRange(p.heightCm)[1] * 1.1)
  let total = reference * fraction[p.level - 1]
  if (p.sex === 'female') total *= 0.7
  const mine = effectiveConditions(p)
  if (mine.some((c) => c === 'senior' || c === 'heart' || c === 'hypertension' || c === 'osteoporosis')) total *= 0.7
  if (e.pose === 'lateralRaise') total *= 0.5

  const step = (kg: number) => Math.round(kg / 2.5) * 2.5
  if (e.gear === 'barbell') return Math.max(step(total), 20)
  if (e.gear === 'dumbbell') return Math.max(step(total * 0.35), 2.5)
  return Math.max(step(total * 0.5), 5)
}

const FLOOR_SUPPORT: PoseId[] = ['pushup', 'kneePushup', 'plank', 'mountainClimber', 'burpee', 'sidePlank', 'plankLegLift', 'cobra', 'sprawl']
const SEATED_MACHINE: PoseId[] = ['benchPress', 'legPress', 'latPulldown', 'seatedRow']
const BALANCE: PoseId[] = ['lunge', 'stepUp', 'singleLegStand', 'calfRaise', 'frontKick', 'roundKick', 'kneeStrike']

/** What this person should know before doing this exercise, most important first. */
export function tipsFor(e: Exercise, p: Profile): Tip[] {
  const tips: Tip[] = []
  const names = (ids: ConditionId[], lang: 'es' | 'en') => ids.map((c) => conditionById(c).name[lang]).join(', ')

  const avoided = matching(e.avoid, p)
  if (avoided.length) {
    const alt = alternativeFor(e, p)
    tips.push({
      id: 'avoid',
      kind: 'avoid',
      text: {
        es: `No recomendado para ti (${names(avoided, 'es')}). ${alt ? `Haz en su lugar: ${alt.name.es}.` : 'Consulta a un profesional antes de hacerlo.'}`,
        en: `Not recommended for you (${names(avoided, 'en')}). ${alt ? `Do this instead: ${alt.name.en}.` : 'Ask a professional before doing it.'}`,
      },
    })
  }

  for (const c of matching(e.caution, p)) {
    tips.push({ id: `cue-${c}`, kind: 'caution', text: conditionById(c).cue })
  }

  const strength = e.slot !== 'cardio' && e.slot !== 'mobility'
  if (p.level === 1 && strength) {
    tips.push({
      id: 'beginner',
      kind: 'info',
      text: {
        es: 'Estás empezando: domina el movimiento sin peso o con muy poco, y termina cada serie pudiendo hacer dos repeticiones más.',
        en: 'You are starting out: master the movement with little or no weight, and end each set with two repetitions in reserve.',
      },
    })
  }

  const load = startingLoadKg(e, p)
  if (load !== null) {
    const unit = e.gear === 'barbell' ? { es: 'en total, barra incluida', en: 'in total, bar included' } : { es: 'por mano', en: 'per hand' }
    tips.push({
      id: 'load',
      kind: 'info',
      text: {
        es: `Carga inicial orientativa para tu peso y nivel: ${load} kg ${unit.es}. Súbela solo si la técnica no cambia.`,
        en: `Suggested starting load for your weight and level: ${load} kg ${unit.en}. Increase it only while your technique stays the same.`,
      },
    })
  }

  if (p.heightCm >= 185 && (e.slot === 'squat' || e.slot === 'hinge')) {
    tips.push({
      id: 'tall',
      kind: 'info',
      text: {
        es: `Con tu estatura (${p.heightCm} cm) separa un poco más los pies y permite más inclinación del torso: en piernas largas es lo correcto.`,
        en: `At your height (${p.heightCm} cm) take a slightly wider stance and allow more forward lean: with long legs that is correct form.`,
      },
    })
  }
  if (p.heightCm <= 160 && SEATED_MACHINE.includes(e.pose)) {
    tips.push({
      id: 'short',
      kind: 'info',
      text: {
        es: 'Ajusta el asiento y, si los pies no quedan planos en el suelo, apóyalos sobre discos o un step.',
        en: 'Adjust the seat and, if your feet do not rest flat on the floor, put them on plates or a step.',
      },
    })
  }
  if (p.age >= 60 && BALANCE.includes(e.pose)) {
    tips.push({
      id: 'balance',
      kind: 'info',
      text: {
        es: 'Ten una pared o una silla firme al alcance de la mano para mantener el equilibrio.',
        en: 'Keep a wall or a sturdy chair within reach for balance.',
      },
    })
  }
  if (bmi(p.weightKg, p.heightCm) >= 30 && FLOOR_SUPPORT.includes(e.pose)) {
    tips.push({
      id: 'floor',
      kind: 'info',
      text: {
        es: 'Si bajar al suelo te resulta incómodo, haz la versión inclinada con las manos en una silla firme o en la pared.',
        en: 'If getting down to the floor is uncomfortable, do the inclined version with your hands on a sturdy chair or the wall.',
      },
    })
  }
  return tips
}
