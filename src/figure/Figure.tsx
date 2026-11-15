import { useMemo, useRef, useState } from 'react'
import type { Gear, PoseId } from '../types'
import { FLOOR_Y, HEAD_R, POSES, VIEW_BOX, solve, type Joint, type Pt, type Skeleton } from './poses'

interface Props {
  pose: PoseId
  gear: Gear
  /** Accessible name: the exercise name. Empty for a decorative figure next to its name. */
  label: string
  /** Animate between the two key frames. Otherwise the working position is drawn over a faint start position. */
  animated?: boolean
  pauseLabel?: string
  playLabel?: string
}

const n = (v: number) => v.toFixed(1)
const pathOf = (points: Pt[]) => points.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join(' ')

const LOOP = {
  dur: '2.8s',
  repeatCount: 'indefinite',
  calcMode: 'spline',
  keyTimes: '0;0.5;1',
  keySplines: '0.45 0 0.55 1;0.45 0 0.55 1',
} as const

/** A line through joints, morphing between the two frames. */
function Bone({ a, b, animated, className }: { a: Pt[]; b: Pt[]; animated: boolean; className: string }) {
  const da = pathOf(a)
  const db = pathOf(b)
  return (
    <path d={db} className={className}>
      {animated && da !== db && <animate attributeName="d" values={`${da};${db};${da}`} {...LOOP} />}
    </path>
  )
}

function Dot({ a, b, r, animated, className }: { a: Pt; b: Pt; r: number; animated: boolean; className: string }) {
  const moves = animated && (a[0] !== b[0] || a[1] !== b[1])
  return (
    <circle cx={n(b[0])} cy={n(b[1])} r={r} className={className}>
      {moves && <animate attributeName="cx" values={`${n(a[0])};${n(b[0])};${n(a[0])}`} {...LOOP} />}
      {moves && <animate attributeName="cy" values={`${n(a[1])};${n(b[1])};${n(a[1])}`} {...LOOP} />}
    </circle>
  )
}

const LIMBS: { joints: Joint[]; far: boolean }[] = [
  { joints: ['sh', 'elB', 'haB'], far: true },
  { joints: ['hip', 'knB', 'ftB'], far: true },
  { joints: ['hip', 'sh'], far: false },
  { joints: ['hip', 'knA', 'ftA'], far: false },
  { joints: ['sh', 'elA', 'haA'], far: false },
]

const shift = (p: Pt, dy: number): Pt => [p[0], p[1] + dy]

export function Figure({ pose, gear, label, animated = false, pauseLabel, playLabel }: Props) {
  const def = POSES[pose]
  const [a, b] = useMemo(() => [solve(def.a), solve(def.b)] as const, [def])
  const svg = useRef<SVGSVGElement>(null)
  const [paused, setPaused] = useState(false)
  const reduced = useMemo(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const moving = animated && !reduced && !def.hold

  const points = (s: Skeleton, joints: Joint[]) => joints.map((j) => s[j])
  const attach: Joint = def.attach === 'sh' ? 'sh' : def.attach === 'hip' ? 'hip' : 'haA'
  const bothHands = attach === 'haA' && gear === 'dumbbell'

  const toggle = () => {
    const el = svg.current
    if (!el) return
    if (paused) el.unpauseAnimations()
    else el.pauseAnimations()
    setPaused(!paused)
  }

  return (
    <div className="figure">
      <svg ref={svg} viewBox={VIEW_BOX} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
        <line x1="2" y1={FLOOR_Y + 2.5} x2="118" y2={FLOOR_Y + 2.5} className="fig-floor" />
        {def.scene?.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="fig-scene" />
        ))}

        {!moving && !def.hold && (
          <g className="fig-ghost">
            {LIMBS.map((l, i) => (
              <path key={i} d={pathOf(points(a, l.joints))} className="fig-bone" />
            ))}
            <circle cx={n(a.head[0])} cy={n(a.head[1])} r={HEAD_R} className="fig-head" />
          </g>
        )}

        {gear === 'band' && (
          <Bone
            a={[a.haA, def.bandTo ?? a.ftA]}
            b={[b.haA, def.bandTo ?? b.ftA]}
            animated={moving}
            className="fig-band"
          />
        )}

        {LIMBS.map((l, i) => (
          <Bone
            key={i}
            a={points(a, l.joints)}
            b={points(b, l.joints)}
            animated={moving}
            className={l.far ? 'fig-bone fig-far' : 'fig-bone'}
          />
        ))}
        <Dot a={a.head} b={b.head} r={HEAD_R} animated={moving} className="fig-head" />

        {gear === 'barbell' && (
          <>
            <Dot a={a[attach]} b={b[attach]} r={8} animated={moving} className="fig-plate" />
            <Dot a={a[attach]} b={b[attach]} r={1.8} animated={moving} className="fig-gear" />
          </>
        )}
        {gear === 'dumbbell' && (
          <>
            <Dot a={a[attach]} b={b[attach]} r={3.4} animated={moving} className="fig-gear" />
            {bothHands && <Dot a={a.haB} b={b.haB} r={3.4} animated={moving} className="fig-gear" />}
          </>
        )}
        {gear === 'kettlebell' && (
          <Dot a={shift(a[attach], 4)} b={shift(b[attach], 4)} r={4.6} animated={moving} className="fig-gear" />
        )}
        {gear === 'ball' && <Dot a={a[attach]} b={b[attach]} r={6} animated={moving} className="fig-ball" />}
      </svg>
      {moving && (
        <button type="button" className="figure-toggle" onClick={toggle} aria-pressed={paused}>
          {paused ? (playLabel ?? 'Play') : (pauseLabel ?? 'Pause')}
        </button>
      )}
    </div>
  )
}
