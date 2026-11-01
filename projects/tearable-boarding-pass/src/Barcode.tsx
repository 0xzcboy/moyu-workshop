import { useMemo } from 'react'
import { mulberry32 } from './geometry'

const W = 160
const H = 56
const ROWS = 7
const CODEWORDS = 6
// PDF417 start and stop patterns as alternating bar/space module widths.
const START = [8, 1, 1, 1, 1, 1, 1, 3]
const STOP = [7, 1, 1, 3, 1, 1, 1, 2, 1]

/** Random bar/space widths for one codeword: 8 elements, 17 modules, each 1–6 wide. */
function codeword(rand: () => number) {
  const widths = Array<number>(8).fill(1)
  for (let left = 9; left > 0; ) {
    const i = Math.floor(rand() * 8)
    if (widths[i] < 6) {
      widths[i]++
      left--
    }
  }
  return widths
}

/** Decorative PDF417-style barcode drawn as one path in the current text color. */
export function Barcode({ seed, className }: { seed: number; className?: string }) {
  const d = useMemo(() => {
    const rand = mulberry32(seed)
    const modules = 17 + CODEWORDS * 17 + 18
    const unit = W / modules
    const rowH = H / ROWS
    const rects: string[] = []
    const bars = (widths: number[], x0: number, y: number, h: number) => {
      let x = x0
      widths.forEach((w, i) => {
        if (i % 2 === 0) rects.push(`M${(x * unit).toFixed(2)},${y}h${(w * unit).toFixed(2)}v${h}h-${(w * unit).toFixed(2)}Z`)
        x += w
      })
      return x
    }
    bars(START, 0, 0, H)
    bars(STOP, 17 + CODEWORDS * 17, 0, H)
    for (let r = 0; r < ROWS; r++) {
      let x = 17
      for (let c = 0; c < CODEWORDS; c++) x = bars(codeword(rand), x, r * rowH, rowH)
    }
    return rects.join('')
  }, [seed])

  return (
    <svg className={className} width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="currentColor" shapeRendering="crispEdges" />
    </svg>
  )
}
