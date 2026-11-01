// Ticket geometry. All values in CSS px of the unscaled 672×280 card.
export const CARD_W = 672
export const CARD_H = 280
export const MAIN_W = 512
export const STUB_W = 160
/** The stub reaches this far under the main ticket so no seam shows. */
export const OVERLAP = 3
export const NOTCH_R = 10

// Perforation: from y=12, a 10px period of 6px cut + 4px paper bridge.
export const PERF_START = 12
export const PERF_PERIOD = 10
export const PERF_CUT = 6
export const BRIDGES = 26

type Pt = [number, number]

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Two offsets in [-1, 1] per perforation period: one for the cut, one for the bridge. */
export function fiberJitter(seed: number): number[] {
  const rand = mulberry32(seed)
  return Array.from({ length: BRIDGES * 2 }, () => rand() * 2 - 1)
}

export const cutCenterY = (i: number) => PERF_START + PERF_PERIOD * i + PERF_CUT / 2
const bridgeCenterY = (i: number) => PERF_START + PERF_PERIOD * i + PERF_CUT + 2
/** Bottom of the last broken bridge; the edge below it is still intact. */
const tearFrontY = (broken: number) => PERF_START + PERF_PERIOD * broken

function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number, steps = 8): Pt[] {
  const pts: Pt[] = []
  for (let s = 0; s <= steps; s++) {
    const a = ((fromDeg + ((toDeg - fromDeg) * s) / steps) * Math.PI) / 180
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

const toPolygon = (pts: Pt[]) =>
  `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(',')})`

interface EdgeOptions {
  radius: number
  broken: number
  fibers: number
  jitter: number[]
}

/** Main ticket outline, in its own coordinates (tear line at x=512). */
export function mainClip({ radius: r, broken, fibers, jitter }: EdgeOptions) {
  const x = MAIN_W
  const pts: Pt[] = [...arc(r, r, r, 180, 270), ...arc(x, 0, NOTCH_R, 180, 90)]
  for (let i = 0; i < broken; i++) {
    pts.push([x + jitter[2 * i] * fibers * 0.35, cutCenterY(i)])
    pts.push([x + jitter[2 * i + 1] * fibers, bridgeCenterY(i)])
  }
  if (broken < BRIDGES) pts.push([x, tearFrontY(broken)])
  pts.push(...arc(x, CARD_H, NOTCH_R, 270, 180), ...arc(r, CARD_H - r, r, 90, 180))
  return toPolygon(pts)
}

// Angle where the notch circle crosses the overlap edge (x = -OVERLAP from its center).
const OVERLAP_DEG = (Math.acos(-OVERLAP / NOTCH_R) * 180) / Math.PI

/** Stub outline, in its own coordinates (overlap at x 0..3, tear line at x=3). */
export function stubClip({ radius: r, broken, fibers, jitter }: EdgeOptions) {
  const L = OVERLAP
  const W = OVERLAP + STUB_W
  const pts: Pt[] = [
    ...arc(L, 0, NOTCH_R, broken > 0 ? 90 : OVERLAP_DEG, 0),
    ...arc(W - r, r, r, 270, 360),
    ...arc(W - r, CARD_H - r, r, 0, 90),
    ...arc(L, CARD_H, NOTCH_R, 0, broken >= BRIDGES ? -90 : -OVERLAP_DEG),
  ]
  if (broken > 0 && broken < BRIDGES) {
    pts.push([0, tearFrontY(broken)], [L, tearFrontY(broken)])
  }
  for (let i = broken - 1; i >= 0; i--) {
    pts.push([L + jitter[2 * i + 1] * fibers, bridgeCenterY(i)])
    pts.push([L + jitter[2 * i] * fibers * 0.35, cutCenterY(i)])
  }
  return toPolygon(pts)
}

/**
 * Remaining paper bridges, in card coordinates. Each bridge runs from the main
 * ticket's edge to the stub's edge, which is rotated `deg` around the bottom of
 * the tear line, so the bridges stretch and neck as the stub swings away.
 */
export function bridgesPath(broken: number, deg: number) {
  if (deg <= 0 || broken >= BRIDGES) return ''
  const t = (deg * Math.PI) / 180
  const sin = Math.sin(t)
  const cos = Math.cos(t)
  // A point on the stub's tear line at height y, tucked 1px under the stub.
  const stubPt = (y: number): Pt => {
    const d = CARD_H - y
    return [MAIN_W + d * sin + cos, CARD_H - d * cos + sin]
  }
  const ax = MAIN_W - 1
  const parts: string[] = []
  for (let i = broken; i < BRIDGES; i++) {
    const y0 = PERF_START + PERF_PERIOD * i + PERF_CUT
    const y1 = Math.min(y0 + PERF_PERIOD - PERF_CUT, CARD_H - NOTCH_R)
    const [b0x, b0y] = stubPt(y0)
    const [b1x, b1y] = stubPt(y1)
    const neck = Math.min((y1 - y0) * 0.3, (b0x - ax) * 0.12)
    const f = (n: number) => n.toFixed(2)
    parts.push(
      `M${f(ax)},${f(y0)}` +
        `Q${f((ax + b0x) / 2)},${f((y0 + b0y) / 2 + neck)} ${f(b0x)},${f(b0y)}` +
        `L${f(b1x)},${f(b1y)}` +
        `Q${f((ax + b1x) / 2)},${f((y1 + b1y) / 2 - neck)} ${f(ax)},${f(y1)}Z`,
    )
  }
  return parts.join('')
}
