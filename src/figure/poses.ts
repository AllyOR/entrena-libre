/**
 * Stick-figure poses. Each pose has two key frames (`a` start, `b` the working position)
 * described with joint angles, so limbs keep their length, and solved to coordinates.
 *
 * Angles are in degrees: 0 points down, 90 to the figure's front (right), 180 up, -90 back.
 * A limb is either two angles (upper segment, lower segment) or an inverse-kinematics
 * target, for a hand or foot that must stay on a fixed spot (push-up hands, bridge feet).
 */
import type { PoseId } from '../types'

export type Pt = readonly [number, number]

export const JOINTS = [
  'head',
  'sh',
  'hip',
  'elA',
  'haA',
  'elB',
  'haB',
  'knA',
  'ftA',
  'knB',
  'ftB',
] as const
export type Joint = (typeof JOINTS)[number]
export type Skeleton = Record<Joint, Pt>

type Angles = readonly [number, number]
interface Reach {
  to: Pt
  /** Which side the elbow or knee bends to. */
  bend: 1 | -1
}
type Limb = Angles | Reach

interface Frame {
  /** The joint pinned to a point of the canvas. It must not belong to a `Reach` limb. */
  anchor: readonly [Joint, number, number]
  torso: number
  armA: Limb
  armB?: Limb
  legA: Limb
  legB?: Limb
}

/** A scene line: x1, y1, x2, y2. */
export type Line = readonly [number, number, number, number]

export interface PoseDef {
  a: Frame
  b: Frame
  scene?: readonly Line[]
  /** Where held gear is drawn. Default: the hands. */
  attach?: 'hand' | 'sh' | 'hip'
  /** Fixed end of a band or cable. Default: the front foot. */
  bandTo?: Pt
  /** A static hold: both frames are the same. */
  hold?: boolean
}

export const FLOOR_Y = 92
export const VIEW_BOX = '0 -14 120 112'
export const HEAD_R = 6

const TORSO = 28
const UPPER_ARM = 13
const FOREARM = 13
const THIGH = 21
const SHIN = 21
const NECK = 9

const rad = (deg: number) => (deg * Math.PI) / 180
const step = (from: Pt, deg: number, len: number): Pt => [
  from[0] + Math.sin(rad(deg)) * len,
  from[1] + Math.cos(rad(deg)) * len,
]
const isReach = (limb: Limb): limb is Reach => !Array.isArray(limb)

/** Two-segment inverse kinematics: the middle joint and the end point for a target. */
function reach(origin: Pt, limb: Reach, l1: number, l2: number): [Pt, Pt] {
  const dx = limb.to[0] - origin[0]
  const dy = limb.to[1] - origin[1]
  const raw = Math.hypot(dx, dy) || 0.001
  const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.001), l1 + l2 - 0.001)
  const ux = dx / raw
  const uy = dy / raw
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const off = Math.sqrt(Math.max(l1 * l1 - along * along, 0)) * limb.bend
  const mid: Pt = [origin[0] + ux * along - uy * off, origin[1] + uy * along + ux * off]
  return [mid, [origin[0] + ux * d, origin[1] + uy * d]]
}

function limb(origin: Pt, spec: Limb, l1: number, l2: number): [Pt, Pt] {
  if (isReach(spec)) return reach(origin, spec, l1, l2)
  const mid = step(origin, spec[0], l1)
  return [mid, step(mid, spec[1], l2)]
}

/** Solves a frame to joint coordinates. */
export function solve(frame: Frame): Skeleton {
  const build = (hip: Pt): Skeleton => {
    const sh = step(hip, frame.torso, TORSO)
    const [elA, haA] = limb(sh, frame.armA, UPPER_ARM, FOREARM)
    const [elB, haB] = limb(sh, frame.armB ?? frame.armA, UPPER_ARM, FOREARM)
    const [knA, ftA] = limb(hip, frame.legA, THIGH, SHIN)
    const [knB, ftB] = limb(hip, frame.legB ?? frame.legA, THIGH, SHIN)
    return { head: step(sh, frame.torso, NECK), sh, hip, elA, haA, elB, haB, knA, ftA, knB, ftB }
  }
  // First pass with the hip at the origin finds where the anchor falls; the second
  // pass moves the hip so the anchor lands on its point and re-solves the reach limbs.
  const [joint, x, y] = frame.anchor
  const draft = build([0, 0])
  return build([x - draft[joint][0], y - draft[joint][1]])
}

const CHAIR: readonly Line[] = [
  [40, 75, 61, 75],
  [42, 75, 42, FLOOR_Y],
  [59, 75, 59, FLOOR_Y],
  [40, 75, 37, 48],
]
const BOX: readonly Line[] = [
  [68, 80, 98, 80],
  [68, 80, 68, FLOOR_Y],
  [98, 80, 98, FLOOR_Y],
]
const SUPINE_KNEES_UP: Angles = [150, 30]

const squatDown = (armA: Limb): Frame => ({ anchor: ['ftA', 58, 92], torso: 150, armA, legA: [80, -25] })
const standing = (armA: Limb, x = 58): Frame => ({ anchor: ['ftA', x, 92], torso: 180, armA, legA: [0, 0] })
const pushupTop: Frame = {
  anchor: ['ftA', 20, 90],
  torso: 110,
  armA: { to: [86, 92], bend: 1 },
  legA: [-70, -70],
}

export const POSES: Record<PoseId, PoseDef> = {
  squat: { a: standing([8, 15]), b: squatDown([80, 88]) },
  squatHold: { a: standing([15, 155]), b: squatDown([30, 150]) },
  barSquat: { a: standing([-25, 175]), b: squatDown([-20, 170]), attach: 'sh' },
  jumpSquat: {
    a: squatDown([-30, -20]),
    b: { anchor: ['ftA', 58, 85], torso: 180, armA: [140, 150], legA: [3, 3] },
  },
  sitToStand: {
    a: { anchor: ['ftA', 72, 92], torso: 172, armA: [75, 85], legA: [90, 0] },
    b: standing([8, 15], 72),
    scene: CHAIR,
  },
  wallSit: {
    a: { anchor: ['ftA', 62, 92], torso: 180, armA: [30, 80], legA: [90, 0] },
    b: { anchor: ['ftA', 62, 92], torso: 180, armA: [30, 80], legA: [90, 0] },
    scene: [[36.5, -6, 36.5, FLOOR_Y]],
    hold: true,
  },
  lunge: {
    a: { anchor: ['ftA', 76, 92], torso: 180, armA: [5, 10], legA: [28, 28], legB: [-28, -28] },
    b: { anchor: ['ftA', 76, 92], torso: 180, armA: [5, 10], legA: [85, 0], legB: [-15, -80] },
  },
  stepUp: {
    a: {
      anchor: ['hip', 54, 51],
      torso: 172,
      armA: [10, 20],
      legA: { to: [74, 79], bend: -1 },
      legB: { to: [50, 92], bend: -1 },
    },
    b: {
      anchor: ['hip', 74, 38],
      torso: 180,
      armA: [5, 12],
      legA: { to: [74, 79], bend: -1 },
      legB: { to: [68, 77], bend: -1 },
    },
    scene: BOX,
  },
  boxJump: {
    a: { anchor: ['ftA', 44, 92], torso: 150, armA: [-30, -20], legA: [80, -25] },
    b: { anchor: ['ftA', 82, 79], torso: 165, armA: [60, 80], legA: [45, -15] },
    scene: BOX,
  },
  calfRaise: {
    a: standing([8, 15], 60),
    b: { anchor: ['ftA', 60, 87], torso: 180, armA: [8, 15], legA: [0, 0] },
  },
  deadlift: {
    a: standing([3, 3], 62),
    b: { anchor: ['ftA', 62, 92], torso: 112, armA: [0, 0], legA: [40, -10] },
  },
  swing: {
    a: { anchor: ['ftA', 60, 92], torso: 125, armA: [-20, -25], legA: [35, -12] },
    b: { anchor: ['ftA', 60, 92], torso: 182, armA: [92, 95], legA: [0, 0] },
  },
  row: {
    a: { anchor: ['ftA', 58, 92], torso: 118, armA: [0, 0], legA: [30, -15] },
    b: { anchor: ['ftA', 58, 92], torso: 118, armA: [-65, 25], legA: [30, -15] },
  },
  overheadPress: { a: standing([35, 160], 60), b: standing([150, 176], 60) },
  thruster: { a: squatDown([30, 150]), b: standing([150, 176]) },
  slam: {
    a: standing([150, 176], 60),
    b: { anchor: ['ftA', 60, 92], torso: 135, armA: [20, 25], legA: [50, -22] },
  },
  curl: { a: standing([0, 8], 60), b: standing([0, 150], 60) },
  tricepsExt: { a: standing([150, -30], 60), b: standing([150, 176], 60) },
  lateralRaise: {
    a: { anchor: ['hip', 60, 50], torso: 180, armA: [-8, -8], armB: [8, 8], legA: [-7, -7], legB: [7, 7] },
    b: { anchor: ['hip', 60, 50], torso: 180, armA: [-88, -88], armB: [88, 88], legA: [-7, -7], legB: [7, 7] },
  },
  pullup: {
    a: { anchor: ['haA', 60, 9], torso: 180, armA: [168, 178], legA: [20, -75] },
    b: { anchor: ['haA', 60, 9], torso: 180, armA: [20, 175], legA: [20, -75] },
    scene: [[50, 7, 70, 7]],
  },
  latPulldown: {
    a: { anchor: ['hip', 50, 70], torso: 185, armA: [172, 176], legA: [88, 0] },
    b: { anchor: ['hip', 50, 70], torso: 188, armA: [50, 165], legA: [88, 0] },
    scene: [
      [40, 74, 60, 74],
      [50, 74, 50, FLOOR_Y],
    ],
    bandTo: [56, -10],
  },
  seatedRow: {
    a: { anchor: ['hip', 40, 88], torso: 175, armA: [80, 85], legA: [84, 94] },
    b: { anchor: ['hip', 40, 88], torso: 183, armA: [-50, 80], legA: [84, 94] },
    bandTo: [92, 64],
  },
  legPress: {
    a: { anchor: ['hip', 38, 80], torso: 220, armA: [20, 60], legA: [140, 60] },
    b: { anchor: ['hip', 38, 80], torso: 220, armA: [20, 60], legA: [112, 112] },
    scene: [
      [38, 86, 14, 58],
      [38, 86, 54, 86],
      [62, 86, 96, 54],
    ],
  },
  dip: {
    a: { anchor: ['haA', 43, 65], torso: 184, armA: [0, 0], legA: { to: [84, 91], bend: -1 } },
    b: { anchor: ['haA', 43, 65], torso: 186, armA: [-55, 55], legA: { to: [84, 91], bend: -1 } },
    scene: [
      [22, 67, 44, 67],
      [25, 67, 25, FLOOR_Y],
      [41, 67, 41, FLOOR_Y],
    ],
  },
  pushup: {
    a: pushupTop,
    b: { anchor: ['ftA', 20, 90], torso: 96, armA: { to: [86, 92], bend: 1 }, legA: [-84, -84] },
  },
  kneePushup: {
    a: { anchor: ['knA', 42, 90], torso: 119, armA: { to: [85, 92], bend: 1 }, legA: [-61, -115] },
    b: { anchor: ['knA', 42, 90], torso: 99, armA: { to: [85, 92], bend: 1 }, legA: [-81, -115] },
  },
  inclinePushup: {
    a: { anchor: ['ftA', 20, 90], torso: 131, armA: { to: [79, 68], bend: 1 }, legA: [-49, -49] },
    b: { anchor: ['ftA', 20, 90], torso: 116, armA: { to: [79, 68], bend: 1 }, legA: [-64, -64] },
    scene: [
      [74, 70, 100, 70],
      [78, 70, 78, FLOOR_Y],
      [97, 70, 97, FLOOR_Y],
    ],
  },
  wallPushup: {
    a: { anchor: ['ftA', 60, 92], torso: 170, armA: { to: [98, 28], bend: 1 }, legA: [-10, -10] },
    b: { anchor: ['ftA', 60, 92], torso: 158, armA: { to: [98, 28], bend: 1 }, legA: [-22, -22] },
    scene: [[101, -6, 101, FLOOR_Y]],
  },
  plank: {
    a: { anchor: ['ftA', 22, 90], torso: 99, armA: [0, 90], legA: [-81, -81] },
    b: { anchor: ['ftA', 22, 90], torso: 99, armA: [0, 90], legA: [-81, -81] },
    hold: true,
  },
  sidePlank: {
    a: { anchor: ['ftA', 22, 90], torso: 110, armA: [0, 0], armB: [-70, -70], legA: [-70, -70] },
    b: { anchor: ['ftA', 22, 90], torso: 110, armA: [0, 0], armB: [180, 180], legA: [-70, -70] },
  },
  mountainClimber: {
    a: { anchor: ['haA', 88, 92], torso: 110, armA: [0, 0], legA: [-70, -70], legB: [60, -80] },
    b: { anchor: ['haA', 88, 92], torso: 110, armA: [0, 0], legA: [60, -80], legB: [-70, -70] },
  },
  burpee: {
    a: standing([150, 176], 40),
    b: { anchor: ['ftA', 20, 90], torso: 110, armA: [0, 0], legA: [-70, -70] },
  },
  benchPress: {
    a: { anchor: ['hip', 68, 66], torso: -90, armA: [180, 180], legA: [80, 0] },
    b: { anchor: ['hip', 68, 66], torso: -90, armA: [95, 180], legA: [80, 0] },
    scene: [
      [26, 70, 74, 70],
      [32, 70, 32, FLOOR_Y],
      [68, 70, 68, FLOOR_Y],
    ],
  },
  floorPress: {
    a: { anchor: ['hip', 66, 86], torso: -90, armA: [180, 180], legA: SUPINE_KNEES_UP },
    b: { anchor: ['hip', 66, 86], torso: -90, armA: [92, 180], legA: SUPINE_KNEES_UP },
  },
  crunch: {
    a: { anchor: ['hip', 62, 86], torso: -90, armA: [90, 90], legA: SUPINE_KNEES_UP },
    b: { anchor: ['hip', 62, 86], torso: -122, armA: [75, 80], legA: SUPINE_KNEES_UP },
  },
  legRaise: {
    a: { anchor: ['hip', 56, 86], torso: -90, armA: [90, 90], legA: [92, 92] },
    b: { anchor: ['hip', 56, 86], torso: -90, armA: [90, 90], legA: [172, 172] },
  },
  vSit: {
    a: { anchor: ['hip', 52, 88], torso: 215, armA: [75, 110], legA: [120, 60] },
    b: { anchor: ['hip', 52, 88], torso: 215, armA: [15, 70], legA: [120, 60] },
  },
  deadBug: {
    a: { anchor: ['hip', 60, 86], torso: -90, armA: [180, 180], legA: [178, 90] },
    b: {
      anchor: ['hip', 60, 86],
      torso: -90,
      armA: [180, 180],
      armB: [-100, -100],
      legA: [178, 90],
      legB: [100, 100],
    },
  },
  gluteBridge: {
    a: { anchor: ['sh', 34, 86], torso: -90, armA: [90, 90], legA: { to: [86, 91], bend: -1 } },
    b: { anchor: ['sh', 34, 86], torso: -70, armA: [90, 90], legA: { to: [86, 91], bend: -1 } },
    attach: 'hip',
  },
  superman: {
    a: { anchor: ['hip', 60, 87], torso: -90, armA: [-90, -90], legA: [90, 90] },
    b: { anchor: ['hip', 60, 87], torso: -106, armA: [-112, -112], legA: [106, 106] },
  },
  birdDog: {
    a: { anchor: ['knA', 46, 90], torso: 96, armA: [0, 0], legA: [0, -90] },
    b: {
      anchor: ['knA', 46, 90],
      torso: 96,
      armA: [0, 0],
      armB: [100, 100],
      legA: [0, -90],
      legB: [-96, -96],
    },
  },
  childPose: {
    a: { anchor: ['knA', 56, 90], torso: 96, armA: { to: [92, 91], bend: -1 }, legA: [0, -90] },
    b: { anchor: ['knA', 56, 90], torso: 86, armA: { to: [92, 91], bend: -1 }, legA: [65, -90] },
  },
  kneeToChest: {
    a: { anchor: ['hip', 60, 86], torso: -90, armA: [90, 90], legA: [90, 90] },
    b: {
      anchor: ['hip', 60, 86],
      torso: -90,
      armA: { to: [54, 67], bend: 1 },
      legA: [-160, 95],
      legB: [90, 90],
    },
  },
  sideLegRaise: {
    a: { anchor: ['hip', 58, 86], torso: -90, armA: [-90, -90], armB: [90, 90], legA: [90, 90] },
    b: {
      anchor: ['hip', 58, 86],
      torso: -90,
      armA: [-90, -90],
      armB: [90, 90],
      legA: [90, 90],
      legB: [118, 118],
    },
  },
  forwardFold: {
    a: { anchor: ['hip', 40, 88], torso: 180, armA: [40, 80], legA: [90, 90] },
    b: { anchor: ['hip', 40, 88], torso: 128, armA: [85, 95], legA: [90, 90] },
  },
  jumpingJack: {
    a: { anchor: ['hip', 60, 50], torso: 180, armA: [-10, -10], armB: [10, 10], legA: [-4, -4], legB: [4, 4] },
    b: {
      anchor: ['hip', 60, 53.6],
      torso: 180,
      armA: [-150, -150],
      armB: [150, 150],
      legA: [-24, -24],
      legB: [24, 24],
    },
  },
  highKnees: {
    a: { anchor: ['hip', 60, 50], torso: 180, armA: [-35, 40], armB: [35, 110], legA: [85, 5], legB: [0, 0] },
    b: { anchor: ['hip', 60, 50], torso: 180, armA: [35, 110], armB: [-35, 40], legA: [0, 0], legB: [85, 5] },
  },
  walk: {
    a: { anchor: ['hip', 60, 51], torso: 178, armA: [-20, -5], armB: [20, 35], legA: [22, 12], legB: [-18, -30] },
    b: { anchor: ['hip', 60, 51], torso: 178, armA: [20, 35], armB: [-20, -5], legA: [-18, -30], legB: [22, 12] },
  },
  jumpRope: {
    a: { anchor: ['ftA', 60, 92], torso: 180, armA: [15, 75], legA: [12, -12] },
    b: { anchor: ['ftA', 60, 85], torso: 180, armA: [15, 80], legA: [3, 3] },
  },
  seated: {
    a: { anchor: ['ftA', 72, 92], torso: 176, armA: [35, 80], legA: [90, 0] },
    b: { anchor: ['ftA', 72, 92], torso: 183, armA: [35, 80], legA: [90, 0] },
    scene: CHAIR,
  },
  pendulum: {
    a: {
      anchor: ['ftA', 56, 92],
      torso: 120,
      armA: [-18, -18],
      armB: { to: [84, 61], bend: 1 },
      legA: [18, -8],
    },
    b: {
      anchor: ['ftA', 56, 92],
      torso: 120,
      armA: [18, 18],
      armB: { to: [84, 61], bend: 1 },
      legA: [18, -8],
    },
    scene: [
      [78, 63, 102, 63],
      [90, 63, 90, FLOOR_Y],
    ],
  },
  singleLegStand: {
    a: { anchor: ['ftA', 60, 92], torso: 180, armA: [20, 30], legA: [0, 0] },
    b: { anchor: ['ftA', 60, 92], torso: 180, armA: [25, 40], legA: [0, 0], legB: [70, -10] },
  },
}
