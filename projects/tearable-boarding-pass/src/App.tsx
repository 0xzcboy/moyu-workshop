import { useEffect, useState } from 'react'
import { DialRoot, useDialKit, type TransitionConfig } from 'dialkit'
import type { Transition } from 'motion/react'
import { BoardingPass, type Airline } from './BoardingPass'

/** DialKit's editor can switch the spring to an easing curve, which motion spells without a type. */
function toTransition(t: TransitionConfig): Transition {
  return t.type === 'easing' ? { duration: t.duration, ease: t.ease } : t
}

/** Fits the card plus the stub's resting offset, with 32px of margin each side. */
function useFitScale() {
  const compute = () => Math.min(1, (window.innerWidth - 64) / 704)
  const [scale, setScale] = useState(compute)
  useEffect(() => {
    const onResize = () => setScale(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

export function App() {
  const scale = useFitScale()
  const dial = useDialKit('Boarding pass', {
    airline: {
      type: 'select',
      options: [
        { value: 'sakura', label: 'Sakura Air · 樱花粉' },
        { value: 'mint', label: 'Mint Airways · 薄荷绿' },
        { value: 'lavender', label: 'Lavender Lines · 薰衣草紫' },
      ],
      default: 'sakura',
    },
    cabin: { type: 'select', options: ['First', 'Business', 'Premium', 'Economy'], default: 'First' },
    ticket: {
      _collapsed: true,
      passenger: 'MORGAN/ALEX',
      date: '14MAY26',
      from: 'SFO',
      to: 'JFK',
      flight: '216',
      gate: 'B6',
      group: 'PRI',
      seat: '1C',
      boarding: '07:45AM',
      doorsClose: '08:15AM',
      departs: '08:30AM',
      arrives: '05:00PM',
    },
    tear: {
      tearDistance: [120, 60, 240, 1],
      swing: [4, 0, 16, 0.5],
      fibers: [0.5, 0, 1.5, 0.05],
      cornerRadius: [14, 8, 20, 1],
      drop: { type: 'spring', visualDuration: 0.28, bounce: 0 },
    },
  })

  return (
    <main className="stage">
      <BoardingPass
        scale={scale}
        airline={dial.airline as Airline}
        cabin={dial.cabin}
        ticket={dial.ticket}
        tearDistance={dial.tear.tearDistance}
        swing={dial.tear.swing}
        fibers={dial.tear.fibers}
        cornerRadius={dial.tear.cornerRadius}
        drop={toTransition(dial.tear.drop)}
      />
      <DialRoot position="top-right" productionEnabled />
    </main>
  )
}
