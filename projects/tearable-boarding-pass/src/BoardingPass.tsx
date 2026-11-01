import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionStyle,
  type Transition,
} from 'motion/react'
import { Barcode } from './Barcode'
import {
  BRIDGES,
  CARD_H,
  CARD_W,
  MAIN_W,
  OVERLAP,
  bridgesPath,
  cutCenterY,
  fiberJitter,
  mainClip,
  stubClip,
} from './geometry'

const AIRLINES = {
  sakura: { name: 'Sakura Air', band: '#f6d6d9', deep: '#e8a9b0', bandDark: '#6b4a55', deepDark: '#93677a' },
  mint: { name: 'Mint Airways', band: '#cdeee0', deep: '#9fd8c0', bandDark: '#3f5e52', deepDark: '#5f8a78' },
  lavender: { name: 'Lavender Lines', band: '#d8d4f2', deep: '#b3abe3', bandDark: '#4d4868', deepDark: '#736c9a' },
}
export type Airline = keyof typeof AIRLINES

export interface Ticket {
  passenger: string
  date: string
  from: string
  to: string
  flight: string
  gate: string
  group: string
  seat: string
  boarding: string
  doorsClose: string
  departs: string
  arrives: string
}

interface BoardingPassProps {
  scale: number
  airline: Airline
  cabin: string
  ticket: Ticket
  /** Drag distance in px that tears the stub fully. */
  tearDistance: number
  /** Stub rotation in degrees at the moment it comes free. */
  swing: number
  /** Amplitude in px of the torn edge's fiber jitter. */
  fibers: number
  cornerRadius: number
  /** Spring the free stub uses to settle beside the ticket. */
  drop: Transition
}

const REST = { x: 24, y: 8, rotate: 2 }
const EASE = [0.32, 0.72, 0, 1] as const
const LIFT_TWEEN = { duration: 0.28, ease: EASE }
const SEED = 216
const ATTACHED = 'Stub attached'

function statusFor(p: number) {
  if (p <= 0) return ATTACHED
  if (p >= 1) return 'Stub torn off'
  if (p >= 0.8) return 'Stub coming free'
  return `Stub ${Math.max(10, Math.round(p * 10) * 10)}% torn`
}

type Controls = ReturnType<typeof animate>

export function BoardingPass({
  scale,
  airline,
  cabin,
  ticket: t,
  tearDistance,
  swing,
  fibers,
  cornerRadius,
  drop,
}: BoardingPassProps) {
  const reduceMotion = useReducedMotion() ?? false
  const progress = useMotionValue(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  const lift = useMotionValue(0)

  const [broken, setBroken] = useState(0)
  const [status, setStatus] = useState(ATTACHED)
  const [free, setFree] = useState(false)
  const freeRef = useRef(false)
  const swingRef = useRef(swing)
  const keyTarget = useRef(0)
  const anims = useRef<Controls[]>([])
  const op = useRef(0)
  const gesture = useRef<{ px: number; py: number; start: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    swingRef.current = swing
    if (!freeRef.current) rotate.set(progress.get() * swing)
  }, [swing, progress, rotate])

  // While attached, tear progress drives the swing and the lift.
  useMotionValueEvent(progress, 'change', (p) => {
    setBroken(Math.min(BRIDGES, Math.floor(p * BRIDGES)))
    setStatus(statusFor(p))
    if (!freeRef.current) {
      rotate.set(p * swingRef.current)
      lift.set(p)
    }
  })

  const bridges = useTransform(() =>
    bridgesPath(Math.min(BRIDGES, Math.floor(progress.get() * BRIDGES)), rotate.get()),
  )

  const jitter = useMemo(() => fiberJitter(SEED), [])
  const [mainClipPath, stubClipPath] = useMemo(() => {
    const edge = { radius: cornerRadius, broken, fibers, jitter }
    return [mainClip(edge), stubClip(edge)]
  }, [cornerRadius, broken, fibers, jitter])

  /** Stops running animations and invalidates their completion callbacks. */
  const stop = () => {
    anims.current.forEach((a) => a.stop())
    anims.current = []
    return ++op.current
  }

  const setFreeState = (value: boolean) => {
    freeRef.current = value
    setFree(value)
  }

  /** Drops the free stub onto the desk beside the main ticket. */
  const settle = () => {
    stop()
    if (reduceMotion) {
      x.set(REST.x)
      y.set(REST.y)
      rotate.set(REST.rotate)
      lift.set(0)
      return
    }
    anims.current = [
      animate(x, REST.x, drop),
      animate(y, REST.y, drop),
      animate(rotate, REST.rotate, drop),
      animate(lift, 0, LIFT_TWEEN),
    ]
  }

  const tearTo = (target: number) => {
    const to = Math.min(1, target)
    if (freeRef.current || to <= progress.get()) return
    const id = stop()
    const done = () => {
      if (id !== op.current || progress.get() < 1) return
      setFreeState(true)
      settle()
    }
    if (reduceMotion) {
      progress.set(to)
      done()
      return
    }
    const a = animate(progress, to, { duration: to >= 1 ? 0.45 : 0.2, ease: EASE })
    anims.current = [a]
    a.then(done)
  }

  const reattach = () => {
    const id = stop()
    gesture.current = null
    keyTarget.current = 0
    const finish = () => {
      if (id !== op.current) return
      setFreeState(false)
      x.set(0)
      y.set(0)
      progress.set(0)
      rotate.set(0)
      lift.set(0)
    }
    if (reduceMotion) return finish()
    anims.current = [
      animate(x, 0, drop),
      animate(y, 0, drop),
      animate(rotate, 0, drop),
      animate(lift, 0, LIFT_TWEEN),
    ]
    Promise.all(anims.current).then(finish)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer already gone (or synthetic); the drag still works without capture.
    }
    stop()
    gesture.current = { px: e.clientX, py: e.clientY, start: progress.get(), ox: x.get(), oy: y.get() }
    if (freeRef.current) anims.current = [animate(lift, 1, { duration: 0.15, ease: EASE })]
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current
    if (!g) return
    const dx = (e.clientX - g.px) / scale
    const dy = (e.clientY - g.py) / scale
    if (freeRef.current) {
      x.set(g.ox + dx)
      y.set(g.oy + dy)
      return
    }
    const raw = (dx * 0.65 + dy * 0.35 - 4) / tearDistance
    // Progress only ever grows: the peak of this gesture, on top of earlier ones.
    const p = Math.min(1, g.start + Math.max(0, raw))
    if (p > progress.get()) progress.set(p)
    if (p >= 1) {
      setFreeState(true)
      // Rebase so the stub picks up from where it came free, without a jump.
      Object.assign(g, { px: e.clientX, py: e.clientY, ox: x.get(), oy: y.get() })
    }
  }

  const onPointerUp = () => {
    if (!gesture.current) return
    gesture.current = null
    if (freeRef.current) settle()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      tearTo(1)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(keyTarget.current, progress.get()) + 0.1
      keyTarget.current = Math.min(1, Math.round(next * 100) / 100)
      tearTo(keyTarget.current)
    }
  }

  const theme = AIRLINES[airline]
  const passStyle = {
    width: CARD_W,
    height: CARD_H,
    transform: `scale(${scale})`,
    '--band': theme.band,
    '--band-deep': theme.deep,
    '--band-dark': theme.bandDark,
    '--band-deep-dark': theme.deepDark,
  } as CSSProperties

  const holes = (left: number) =>
    Array.from({ length: BRIDGES - broken }, (_, k) => (
      <span key={k} className="hole" style={{ left: left - 3, top: cutCenterY(broken + k) - 3 }} />
    ))

  return (
    <div className="pass-wrap">
      <div className="pass-sizer" style={{ width: CARD_W * scale, height: CARD_H * scale }}>
        <div className="pass" style={passStyle}>
          {/* The shadow lives on a wrapper: clip-path would cut off a filter on the same element. */}
          <div className="main-shadow">
          <div className="piece main" style={{ width: MAIN_W, clipPath: mainClipPath }}>
            <div className="band">
              <span className="logo" aria-hidden="true" />
              <span className="airline">{theme.name}</span>
              <span className="title">Boarding Pass</span>
              <span className="cabin">{cabin}</span>
            </div>

            <div className="barcode-slot">
              <Barcode seed={SEED} className="barcode" />
            </div>

            <div className="main-body">
              <div className="row">
                <Field label="Passenger" value={t.passenger} grow />
                <Field label="Date" value={t.date} />
                <Field label="Flight" value={t.flight} />
              </div>
              <span className="dash" />
              <Route from={t.from} to={t.to} />
              <span className="dash" />
              <div className="row">
                <Field label="Gate" value={t.gate} big />
                <Field label="Group" value={t.group} big />
                <Field label="Seat" value={t.seat} big />
              </div>
              <span className="dash" />
              <div className="row">
                <Field label="Boarding" value={t.boarding} />
                <Field label="Doors close" value={t.doorsClose} />
                <Field label="Departs" value={t.departs} />
                <Field label="Arrives" value={t.arrives} />
              </div>
            </div>
            {holes(MAIN_W)}
          </div>
          </div>

          <svg className="bridges" width={CARD_W} height={CARD_H} aria-hidden="true">
            <motion.path d={bridges} />
          </svg>

          <motion.button
            type="button"
            className="stub"
            data-free={free || undefined}
            aria-label={`Boarding pass stub, flight ${t.flight}, seat ${t.seat}. Drag, or press Enter to tear off; arrow keys tear 10% at a time.`}
            aria-describedby="stub-status"
            style={
              {
                left: MAIN_W - OVERLAP,
                width: OVERLAP + 160,
                height: CARD_H,
                x,
                y,
                rotate,
                transformOrigin: `${OVERLAP}px ${CARD_H}px`,
                '--stub-lift': lift,
              } as MotionStyle
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <span className="piece stub-piece" style={{ clipPath: stubClipPath }}>
              <span className="band stub-band">
                <span className="logo" aria-hidden="true" />
                <span className="cabin">{cabin}</span>
              </span>
              <span className="stub-body">
                <Field label="Passenger" value={t.passenger} />
                <span className="row">
                  <Field label="Date" value={t.date} grow />
                  <Field label="Flight" value={t.flight} />
                </span>
                <span className="dash" />
                <Route from={t.from} to={t.to} small />
                <span className="dash" />
                <span className="row">
                  <Field label="Seat" value={t.seat} big />
                  <Field label="Gate" value={t.gate} big />
                  <Field label="Group" value={t.group} big />
                </span>
              </span>
              {holes(OVERLAP)}
            </span>
          </motion.button>
        </div>
      </div>

      <button type="button" className="reattach" onClick={reattach}>
        Reattach
      </button>
      <p id="stub-status" className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}

function Field({ label, value, big, grow }: { label: string; value: string; big?: boolean; grow?: boolean }) {
  return (
    <span className={`field${big ? ' big' : ''}${grow ? ' grow' : ''}`}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </span>
  )
}

function Route({ from, to, small }: { from: string; to: string; small?: boolean }) {
  return (
    <span className={`route${small ? ' small' : ''}`}>
      <span className="code">{from}</span>
      <span className="route-line" aria-hidden="true" />
      <span className="plane" aria-label="to">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      </span>
      <span className="route-line" aria-hidden="true" />
      <span className="code">{to}</span>
    </span>
  )
}
